import { exec } from 'child_process';
import { promisify } from 'util';
import { NextRequest } from 'next/server';


/**
 * @swagger
 * /api/compress-glb:
 * post:
 * tags:
 * - 3D Model
 * summary: 지정된 파일의 GLB 파일을 압축합니다.
 * description: 요청 본문으로 제공된 디렉토리 경로에 있는 모든 GLB 파일을 gltf-pipeline 압축 라이브러리를 사용하여 최적화합니다.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - filePath
 * properties:
 * filePath:
 * type: string
 * description: 압축할 GLB 파일이 포함된 디렉토리의 절대 경로
 * example: /path/to/your/glb/files
 * responses:
 * '200':
 * description: 압축 성공
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: GLB 파일 압축이 완료되었습니다.
 * compressedCount:
 * type: number
 * description: 압축에 성공한 파일의 수
 * '400':
 * description: 잘못된 요청
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: 디렉토리 경로가 필요합니다.
 * '405':
 * description: 허용되지 않는 HTTP 메서드
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: Method not allowed
 * '500':
 * description: 서버 내부 오류
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: 압축 처리 중 오류가 발생했습니다.
 * details:
 * type: string
 * example: '압축 라이브러리 실행 실패'
 */


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