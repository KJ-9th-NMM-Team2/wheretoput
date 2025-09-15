import fs from 'fs/promises';
import path from 'path';

// 캐시 메타데이터 타입 정의
interface CacheFileInfo {
    lastAccessed: string;
    accessCount: number;
    fileSize: number;
    createdAt: string;
}

interface CacheMetadata {
    files: Record<string, CacheFileInfo>;
    totalSize: number;
    maxSize: number;
    lastCleanup: string;
}

class CacheManager {
    private readonly CACHE_DIR: string;
    private readonly CACHE_META_DIR: string;
    private readonly MAX_SIZE: number;
    private lockFile: boolean = false; // 간단한 파일 락

    constructor(cacheDir: string, maxSizeInMB: number = 300) {
        this.CACHE_DIR = path.join(cacheDir, 'public', 'cache', 'models');
        this.CACHE_META_DIR = path.join(cacheDir, 'cache-medata.json');
        this.MAX_SIZE = 1024 * 1024 * maxSizeInMB;
    }

    // 디렉토리 생성
    private async ensureDir(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    private async waitLock(): Promise<void> {
        while (this.lockFile) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        this.lockFile = true;
    }

    private releaseLock(): void {
        this.lockFile = false;
    }

    // 메타데이터 읽기
    private async readMetaData(): Promise<CacheMetadata> {
        try {
            const data = await fs.readFile(this.CACHE_META_DIR, 'utf-8');
            return JSON.parse(data);
        } catch {
            // 파일이 없으면 초기 메타 데이터 생성
            return {
                files: {},
                totalSize: 0,
                maxSize: this.MAX_SIZE,
                lastCleanup: new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}),
            }
        }
    }

    // 메타데이터 저장
    private async writeMetaData(metadata: CacheMetadata): Promise<void> {
        // 파일 저장할 때 락 걸고
        try {
            await this.ensureDir(path.dirname(this.CACHE_DIR));
            await fs.writeFile(this.CACHE_META_DIR, JSON.stringify(metadata, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error writing metadata:', error);
        }
    }

    // 실제 파일 크기 확인
    private async getFileSize(filename: string): Promise<number> {
        try {
            const filePath = path.join(this.CACHE_DIR, filename);
            const filesize = fs.stat(filePath);
            return (await filesize).size;
        } catch {
            return 0;
        }
    }

    // 파일 접근 기록
    async recordFileAccess(filename: string): Promise<void> {
        await this.waitLock();
        try {
            const metadata = await this.readMetaData();
            const fileSize = await this.getFileSize(filename);

            if (fileSize === 0) {
                console.warn(`File ${filename} not found or empty`);
                this.releaseLock();
                return;
            }

            // console.log("recordFileAccess metadata", metadata);
            // console.log("recordFileAccess fileSize", fileSize);

            const currentTime = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});

            if (metadata.files[filename]) {
                // 기존 파일 업데이트
                metadata.files[filename].lastAccessed = currentTime;
                metadata.files[filename].accessCount += 1;

                metadata.totalSize -= metadata.files[filename].fileSize;
                metadata.totalSize += fileSize;

                metadata.files[filename].fileSize = fileSize;
                console.log("💾 기존 파일 업데이트 filename", filename);
            } else {
                // 새 파일 추가
                console.log("💾 새 파일 추가 filename", filename);
                metadata.files[filename] = {
                    lastAccessed: currentTime,
                    accessCount: 1,
                    fileSize,
                    createdAt: currentTime
                };
                metadata.totalSize += fileSize;
            }
            await this.writeMetaData(metadata);

            // 용량 초과시
            if (metadata.maxSize < metadata.totalSize) {
                // LRU 정책 실행
                await this.cleanUpFiles();
            }
        } catch (error) {
            console.log("file record 중 에러 발생: ", error);
        } finally {
            this.releaseLock();
        }
    }

    // LRU 정책으로 50% 날림
    async cleanUpFiles(): Promise<void> {
        // lock은 cleanUpFiles가 실행되는 recordFileAccess에서 lock 걸려있음
        try {
            const metadata = await this.readMetaData();

            // 가장 오래된 순으로 정렬 (오래된 순)
            const sortedFiles = Object.entries(metadata.files).sort(([, a], [, b]) => new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime());

            let currentSize = metadata.maxSize;
            const targetSize = metadata.maxSize * 0.5; // 50% 줄이기

            for (const [filename, fileInfo] of sortedFiles) {
                if (currentSize <= targetSize) break;

                try {
                    // 실제 파일 삭제
                    const filePath = path.join(this.CACHE_DIR, filename);
                    await fs.unlink(filePath);

                    // 메타데이터에서 제거
                    currentSize -= fileInfo.fileSize;
                    delete metadata.files[filename];

                    console.log(`Deleted cache file: ${filename} (${fileInfo.fileSize} bytes)`);
                } catch (error) {
                    console.error(`Failed to delete file ${filename}:`, error);
                }
            }
            metadata.totalSize = currentSize;
            metadata.lastCleanup = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
            await this.writeMetaData(metadata);
        } catch (error) {
            console.error('Error cleaning up files:', error);
        }
    }

    // 특정 파일이 캐시에 있는지 확인
    async isFileInCache(filename: string): Promise<boolean> {
        try {
            const filePath = path.join(this.CACHE_DIR, filename);
            await fs.access(filePath);
            return true;
        } catch {
            console.log(`[${filename}] is not in cache}`);
            return false;
        }
    }

    // 캐시 상태 조회
    async getCacheStatus(): Promise<{totalFiles: number; totalSize: number; maxSize: number; utilizationPercent: number}> {
        const metadata = await this.readMetaData();
        const totalFiles = Object.keys(metadata.files).length;

        return {
            totalFiles,
            totalSize: metadata.totalSize,
            maxSize: metadata.maxSize,
            utilizationPercent: (metadata.totalSize / metadata.maxSize) * 100
        }
    }

    // 특정 파일을 캐시에서 제거
    async removeFileFromCache(filename: string): Promise<boolean> {
        await this.waitLock();
        try {
            const metadata = await this.readMetaData();
            const fileSize = metadata.files[filename].fileSize
            try {
                const filePath = path.join(this.CACHE_DIR, filename);
                // 파일 제거
                await fs.unlink(filePath);
            } catch (error) {
                console.error(`Failed to delete file ${filename}:`, error);
            }
            

            // 메타 데이터 제거
            metadata.totalSize -= fileSize;
            delete metadata.files[filename];

            await this.writeMetaData(metadata);
            return true;
        } finally {
            this.releaseLock();
        }
    }

    async cleanUpAllCache(): Promise<void> {
        await this.waitLock();
        try {
            const metadata = await this.readMetaData();

            // 모든 파일 제거
            for (const filename in metadata.files) {
                try {
                    const filePath = path.join(this.CACHE_DIR, filename);
                    await fs.unlink(filePath);
                } catch (error) {
                    console.error(`Failed to delete file ${filename}:`, error);
                }
            }

            // 메타데이터 정리
            const cleanMetadata: CacheMetadata = {
                files: {},
                totalSize: 0,
                maxSize: this.MAX_SIZE,
                lastCleanup: new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}),
            }

            await this.writeMetaData(cleanMetadata);
        } finally {
            this.releaseLock();
        }
    }

    async increaseFileAccess(filename: string): Promise<void> {
        await this.waitLock();
        try {
            const metadata = await this.readMetaData();

            metadata.files[filename].accessCount += 1;
            metadata.files[filename].lastAccessed = new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
            console.log(`[${filename}] 접근 횟수, 마지막 접근 시간 변경`);
            
            await this.writeMetaData(metadata);
        } finally {
            this.releaseLock();
        }
    }
}

// 싱글톤 인스턴스 생성
const CACHE_DIR = process.cwd(); // PROJECT ROOT 배포 시 에러 발생해서 이렇게 수정
const cacheManager = new CacheManager(CACHE_DIR);

export default cacheManager;