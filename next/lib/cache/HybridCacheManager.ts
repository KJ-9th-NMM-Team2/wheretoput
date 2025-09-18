import { Redis } from "ioredis";
import cacheManager, { CacheFileInfo, CacheMetadata } from "./CacheManager";

class HybridCacheManager {
    private redis?: Redis;
    private isRedisConnected: boolean = false;

    constructor(maxSizeInMB: number = 10, useRedis: boolean = false) {
        if (useRedis) {
            try {
                const redisUrl = process.env.REDIS_CACHE_META_URL || "redis://redis:6379/1";
                this.redis = new Redis(redisUrl, {
                    retryDelayOnFailover: 100,    // 장애 시 재시도 간격
                    maxRetriesPerRequest: 3,      // 요청당 최대 재시도
                    lazyConnect: true             // 실제 사용 시점에 연결
                });

                // 연결 성공 이벤트
                this.redis.on("connect", () => {
                    this.isRedisConnected = true;
                    console.log("✅ Redis 연결 성공:", redisUrl);
                })

                // 연결 준비 완료 이벤트 (확인용)
                this.redis.on("ready", () => {
                    console.log("🚀 Redis 서버 준비 완료 - 명령어 실행 가능");
                })

                // 연결 오류 이벤트
                this.redis.on("error", (error) => {
                    this.isRedisConnected = false;
                    console.warn("❌ Redis 연결 오류:", error.message);
                })

                // 연결 종료 이벤트
                this.redis.on("close", () => {
                    this.isRedisConnected = false;
                    console.warn("⚠️ Redis 연결 종료됨");
                })

                console.log("⚙️ Redis 연결 시도 중...", redisUrl);
            } catch (error) {
                console.warn("❌ Redis 초기화 실패:", error);
                this.redis = undefined;
            }
        } else {
            console.log("📁 Redis 비활성화 - 파일 시스템 사용");
        }
    }
    
    private async readMetaData(): Promise<CacheMetadata> {
        if (this.redis) {
            try {
                // 모든 파일 키 조회
                const fileKeys = await this.redis.keys("file:*");
                const files: { [key: string]: CacheFileInfo} = {};

                // 파이프라인으로 한 번에 조회 (성능 최적화)
                const pipeline = this.redis.pipeline();
                fileKeys.forEach(key => pipeline.hgetall(key));
                const results = await pipeline.exec();

                // 결과 조합
                fileKeys.forEach((key, index) => {
                    const filename = key.replace('file:', '');
                    const data = results?.[index]?.[1] as any;
                    if (data && Object.keys(data).length > 0) {
                        files[filename] = {
                            lastAccessed: data.lastAccessed,
                            accessCount: parseInt(data.accessCount),
                            fileSize: parseInt(data.fileSize),
                            createdAt: data.createdAt
                        };
                    }
                });

                const metaInfo = await this.redis.hgetall("cache:meta");
                
                return {
                    files,
                    totalSize: parseInt(metaInfo.totalSize || "0"),
                    maxSize: parseInt(metaInfo.maxSize || "0"),
                    lastCleanup: metaInfo.lastCleanup || new Date().toISOString(),
                }
            } catch (error) {
                console.warn("❌ Redis read failed, falling back to file");
            }
        }
        return cacheManager.readMetaData();
    }

    private async writeMetadata(modelId: string, metadata: CacheMetadata): Promise<void> {
        if (this.redis) {
            try {
                await this.redis.setex('cache-metadata', 3600, JSON.stringify(metadata));
            } catch (error) {
                console.warn("Redis write failed");
            }
        }
    }

    private async getActualFileSize(model: any): Promise<number> {
        if (this.redis) {
            try {
                const size = await this.redis.hget(`file:${model.furniture_id}`, "fileSize");
                // Local metadata에서 size 반환하기
                if (!size) {
                    const localMetadata = await cacheManager.readMetaData();
                    
                    // S3 size 반환하기
                    if (!localMetadata.files[model.furniture_id]) {
                        const modelUrl = model.furnitures?.model_url || model.model_url;
                        console.log("model url check:", modelUrl);
                        const response = await fetch(modelUrl || "");
                        const s3File = await response.arrayBuffer();
                        console.log("s3File size check:", s3File.byteLength);
                        return s3File.byteLength;
                    }
                    return localMetadata.files[model.furniture_id].fileSize;
                }
                return parseInt(size);
            } catch (error) {
                console.warn("❌ Redis file size Error", error);
            }   
        }
        return 0;
    }
    // 개별 파일 정보 저장 (현재는 pipeline.exec()으로 사용 중)
    private async setFileInfo(modelId: string, fileInfo: CacheFileInfo): Promise<void> {
        if (this.redis) {
            try {
                await this.redis.hset(`file:${modelId}`, {
                    lastAccessed: fileInfo.lastAccessed,
                    accessCount: fileInfo.accessCount.toString(),
                    fileSize: fileInfo.fileSize.toString(),
                    createdAt: fileInfo.createdAt
                });
                console.log(`✅ 파일 정보 업데이트: ${modelId}`);
            } catch (error) {
                console.warn("❌ Redis hash write failed:", error);
            }
        }
    }

    // 개별 파일 정보 조회
    private async getFileInfo(modelId: string): Promise<CacheFileInfo | null> {
        if (this.redis) {
            try {
                const data = await this.redis.hgetall(`file:${modelId}`);
                if (Object.keys(data).length === 0) return null;

                return {
                    lastAccessed: data.lastAccessed,
                    accessCount: parseInt(data.accessCount),
                    fileSize: parseInt(data.filesize),
                    createdAt: data.createdAt
                }
            } catch (error) {
                console.warn("❌ Redis hash read failed:", error);
            }
        }
        return null;
    }

    async updateSingleFile(model: any): Promise<void> {
        
        try {
            const fileSize = await this.getActualFileSize(model);
            if (fileSize === 0) {
                console.warn(`❌ File ${model.furniture_id} not found or empty`);
                return;
            }

            const currentTime = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
            const existingFile = await this.getFileInfo(model.furniture_id);

            if (existingFile && this.isRedisConnected && this.redis && fileSize) {
                const pipeline = this.redis.pipeline();
                pipeline.hset(`file:${model.furniture_id}`, "lastAccessed", currentTime);
                pipeline.hincrby(`file:${model.furniture_id}`, "accessCount", 1);
                pipeline.hset(`file:${model.furniture_id}`, "fileSize", fileSize?.toString());
                
                pipeline.hincrby("cache:meta", "totalSize", fileSize);

                await pipeline.exec(); // queue에 담겨 있던 파일들을 한 번에 업데이트
                console.log("💾 기존 파일 업데이트 (Hash):", model.furniture_id);
            } else if(this.isRedisConnected && this.redis && fileSize){
                // 새 파일 추가
                console.log("여기로 들어와야 하는데")
                const newFileInfo: CacheFileInfo = {
                    lastAccessed: currentTime,
                    accessCount: 1,
                    fileSize: fileSize,
                    createdAt: currentTime,
                }
                
                if (this.redis) {
                    const pipeline = this.redis.pipeline();
                    pipeline.hset(`file:${model.furniture_id}`, newFileInfo as any);
                    pipeline.hincrby("cache:meta", "totalSize", fileSize);
                    await pipeline.exec();
                    console.log("💾 새 파일 추가 filename", model.furniture_id);
                }
            }
        } catch (error) {
            console.log("❌ Redis Hash update error:", error);
        }
    }

}

const useRedis = process.env.USE_REDIS === 'true';
const hybridCacheManager = new HybridCacheManager(50, useRedis);
export default hybridCacheManager;