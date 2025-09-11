import path from 'path'
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

export const CACHE_DIR = path.join(process.cwd(), '/public/cache/models');

// 캐시 디렉토리 생성
export const ensureCacheDir = async () => {
    // 캐시 디렉토리 생성
    try {
        console.log("✅ 캐시 디렉토리 접근");
        await fs.access(CACHE_DIR);
    } catch {
        console.log("✅ 캐시 디렉토리 생성");
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

// 로컬 파일 캐시 사용
export const useLocalFileCache = async (localPath: string, fileName: string, furniture_id: string) => {
    try {
        await fs.access(localPath);
        console.log('캐시된 파일 사용:', localPath);

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
export const downloadFileFromS3ToLocal = async (furniture: any, localPath: string, fileName: string, furniture_id: string) => {
    const response = await fetch(furniture.model_url);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(localPath, Buffer.from(arrayBuffer));

    const result = NextResponse.json({
        success: true,
        furniture_id: furniture_id,
        model_url: `/api/models/${fileName}`, // 로컬 서빙 URL
        message: 'S3에서 다운로드 및 캐싱을 했습니다.',
        cached: false,
        downloaded: true,
    })
    return result;
}

// S3에서 가져오는게 아니라 바로 로컬에 저장
export const downloadFileToLocal = async (arrayBuffer: any, localPath: string, filename: string, furniture_id: string) => {

    // const arrayBuffer = await response.arrayBuffer();
    console.log('arrayBuffer type:', typeof arrayBuffer);
    console.log('arrayBuffer instanceof ArrayBuffer:', arrayBuffer instanceof ArrayBuffer);


    await fs.writeFile(localPath, Buffer.from(arrayBuffer));

    const result = NextResponse.json({
        success: true,
        furniture_id: furniture_id,
        model_url: `/api/models/${filename}`, // 로컬 서빙 URL
        message: '로컬 파일에 다운로드 및 캐싱을 했습니다.',
        cached: false,
        downloaded: true,
    })
    return result;
}