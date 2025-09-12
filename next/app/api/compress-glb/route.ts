import { exec } from 'child_process';
import { promisify } from 'util';
import { NextRequest } from 'next/server';

const execAsync = promisify(exec);

// Pages Router 방식
export async function POST(req: NextRequest) {
    
    if (req.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const data = await req.json();
    const filePath = data.filePath;

    if (!filePath) {
        return Response.json({ error: '디렉토리 경로가 필요합니다.' }, { status: 400 });
    }

    try {
        const result = await compressGlbFiles(filePath);
        return Response.json(result, { status: 200 });
    } catch (error) {
        console.error('GLB 압축 오류:', error);
        return Response.json({ error: '압축 처리 중 오류가 발생했습니다.', details: error.message }, { status: 500 });

    }
}

// 공통 압축 로직
async function compressGlbFiles(filePath: string) {
    try {

        if (!filePath) {
            return { message: 'GLB 파일이 없습니다.', processed: 0 };
        }

        console.log(`${filePath} GLB 파일 압축 시작`);

        const results = [];

        // Next.js API 타임아웃을 고려해 순차 처리 (더 안전)
        const command = `gltf-pipeline -i "${filePath}" -o "${filePath}" -d`;

        try {
            console.log(`압축 중: ${filePath}`);
            const { stdout, stderr } = await execAsync(command, {
                timeout: 30000 // 30초 타임아웃
            });

            results.push({ filePath, success: true });
            console.log(`완료: ${filePath}`);
        } catch (error) {
            results.push({ filePath, success: false, error: error.message });
            console.error(`실패: ${filePath}`, error.message);
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            message: 'GLB 압축 완료',
            successful,
            failed,
            results
        };
    } catch (error) {
        throw new Error(`압축 처리 실패: ${error.message}`);
    }
}