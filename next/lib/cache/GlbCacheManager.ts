import { Redis } from "ioredis";
import fs from "fs/promises";
import hybridCacheManager from "./HybridCacheManager";
import { prisma } from "../prisma";

class GlbCacheManager {
    private redis?: Redis;
    private isRedisConnected: boolean = false;

    constructor(maxSizeInMB: number = 50, useRedis: boolean = false) {
        if (useRedis) {
            try {
                const redisUrl = process.env.GLB_REDIS_URL || "redis://redis:6379/2";
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
    
    async readFile(model: any): Promise<ArrayBuffer | null> {
        if (this.redis) {
            // 파이프라인으로 한 번에 조회 (성능 최적화)
            const buffer = await this.redis.getBuffer(`file:${model.furniture_id}`);
            
            if (!buffer) {
                return null;
            }

            await hybridCacheManager.updateSingleFile(model);

            // ✅ 안전하게 Uint8Array로 복사해서 ArrayBuffer 리턴
            const arrayBuffer = new Uint8Array(buffer).buffer;
            return arrayBuffer;
        } else {
            console.warn("❌ Redis read failed, falling back to file");
        }
        return null;
    }

    async writeFile(model: any): Promise<void> {
        if (this.redis) {
            try {
                const cacheUrl = model.cached_model_url;
                let buffer;
                
                try {
                    await fs.access(cacheUrl);
                    console.log("캐시된 파일 사용:", cacheUrl);
                    buffer = await fs.readFile(cacheUrl);
                } catch (error) {
                    console.log("❌ local file write redis file failed...");
                    const modelUrl = model.furnitures?.model_url || model.model_url;
                    // URL 존재 여부 확인
                    if (!modelUrl) {
                        console.warn("❌ model_url이 없습니다:", model);
                        return; // 조기 return
                    }

                    try {
                        const response = await fetch(modelUrl);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        buffer = Buffer.from(await response.arrayBuffer());
                    } catch (fetchError) {
                        console.warn("❌ S3에서 파일 가져오기 실패:", fetchError);
                        return; // 조기 return
                    }
                }
                
                if (buffer) {
                    await hybridCacheManager.updateSingleFile(model);
                    // Buffer를 직접 저장 (JSON.stringify 제거)
                    await this.redis.setex(`file:${model.furniture_id}`, 2592000, buffer);

                    await prisma.furnitures.update({
                        where: { furniture_id: model.furniture_id },
                        data: { is_redis_cached: true},
                    })
                    console.log("✅ 파일 저장 성공");
                }
            } catch (error) {
                console.warn("❌ Redis write failed", error);
            }
        }
    }
}

const useRedis = process.env.USE_REDIS === 'true';
const glbCacheManager = new GlbCacheManager(50, useRedis);
export default glbCacheManager;