import * as path from 'path'
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import cacheManager from './CacheManager';

// default DIR
export const CACHE_DIR = path.join(process.cwd(), 'public', 'cache', 'models');

class CacheUtils {
    // 캐시 디렉토리 생성
    ensureCacheDir = async (dir: string) => {
        // 캐시 디렉토리 생성
        try {
            console.log("✅ 캐시 디렉토리 접근");
            await fs.access(dir);
        } catch {
            console.log("✅ 캐시 디렉토리 생성");
            await fs.mkdir(dir, { recursive: true });
        }
    }

    // 로컬 파일 캐시 사용
    useLocalFileCache = async (localPath: string, fileName: string, furniture_id: string) => {
        try {
            await fs.access(localPath);
            console.log('캐시된 파일 사용:', localPath);

            await this.cacheFileAccess(fileName);

            const result = NextResponse.json({
                success: true,
                furniture_id: furniture_id,
                model_url: `/api/models/${fileName}`, // 로컬 서빙 URL
                message: '로컬 파일 캐싱을 사용합니다.',
                cached: true
            })

            return result;
        } catch (error) {
            // 파일이 없으면 null 반환
            return null;
        }
    }

    // 파일 다운로드 S3로부터
    downloadFileFromS3ToLocal = async (furniture: any, localPath: string, fileName: string, furniture_id: string) => {
        const response = await fetch(furniture.model_url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        try {
            const arrayBuffer = await response.arrayBuffer();
            await fs.writeFile(localPath, Buffer.from(arrayBuffer));
            await cacheManager.recordFileAccess(fileName);

            const result = NextResponse.json({
                success: true,
                furniture_id: furniture_id,
                model_url: `/api/models/${fileName}`, // 로컬 서빙 URL
                message: 'S3에서 다운로드 및 캐싱을 했습니다.',
                cached: false,
                downloaded: true,
            })
            return result;
        } catch (error) {
            console.error('Error writing file:', error);
        }
    }

    // S3에서 가져오는게 아니라 Trellis에서 바로 로컬에 저장
    downloadFileFromTrellisToLocal = async (arrayBuffer: any, localPath: string, filename: string, furniture_id: string) => {

        // const arrayBuffer = await response.arrayBuffer();
        console.log('arrayBuffer type:', typeof arrayBuffer);
        console.log('arrayBuffer instanceof ArrayBuffer:', arrayBuffer instanceof ArrayBuffer);

        try {
            await fs.writeFile(localPath, Buffer.from(arrayBuffer));
            await cacheManager.recordFileAccess(filename);

            const result = NextResponse.json({
                success: true,
                furniture_id: furniture_id,
                model_url: `/api/models/${filename}`, // 로컬 서빙 URL
                message: '로컬 파일에 다운로드 및 캐싱을 했습니다.',
                cached: false,
                downloaded: true,
            })
            return result;
        } catch (error) {
            console.error('Error writing file:', error);
        }
    }

    compressLocalGLB = async (filePath: string) => {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        await fetch(`${baseUrl}/api/compress-glb`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filePath: filePath
            })
        });
    }

    private cacheFileAccess = async (filename: string) => {
        try {
            await cacheManager.increaseFileAccess(filename);
            console.log(`[${filename}] 파일 접근 횟수 증가`);
        } catch {
            console.log("파일 접근 횟수 증가 에러 발생");
        }
    }

    private tilCurrentFilesUpdate = async () => {
        const files = await fs.readdir(CACHE_DIR);
        
        files.map(async (file) => {
            cacheManager.recordFileAccess(file);
        })
    }
}

const cacheUtils = new CacheUtils();
export default cacheUtils;