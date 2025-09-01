// .env 에 API 키 추가하세요!
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

import Replicate from "replicate";

// Replicate 클라이언트 설정
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// 실행할 메인 함수
async function main() {
    try {
        console.log("모델을 실행합니다...");
        const output = await replicate.run(
            "firtoz/trellis:06f601b67d482565d4724ae3bc29e5e8cbaa6c4594df900da315d6a02f37ce2a",
            {
                input: {
                    images: ["https://resources.archisketch.com/product/Xf3Z4Ks85B0A121B55B423C/20-06-2021_16-18-49/preview/Xf3Z4Ks85B0A121B55B423C_1.png"],
                    seed: 0,
                    texture_size: 1024,
                    mesh_simplify: 0.95,
                    generate_color: true,
                    generate_model: true,  // 이것을 true로 설정
                    randomize_seed: true,
                    generate_normal: false,
                    ss_sampling_steps: 12,
                    slat_sampling_steps: 12,
                    ss_guidance_strength: 7.5,
                    slat_guidance_strength: 3
                }
            }
        );
        console.log("실행 완료! 이제 파일을 저장합니다...");
        console.log("전체 API 응답:", output);

        if (output.model_file) {
            const url = output.model_file;
            console.log(`모델 URL로부터 파일 다운로드를 시작합니다: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`다운로드 실패: ${response.statusText}`);
            }

            // 🔽🔽🔽 파일 저장 경로 수정 🔽🔽🔽
            // 저장할 디렉토리 경로 설정 ('next/public/trellis')
            const outputDir = path.join(process.cwd(), '..', 'public', 'trellis');
            
            // 디렉토리가 없으면 생성
            fs.mkdirSync(outputDir, { recursive: true });

            // 최종 파일 경로 조합
            const filePath = path.join(outputDir, 'output.glb');
            const writer = fs.createWriteStream(filePath);
            
            await new Promise((resolve, reject) => {
                response.body.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`✅ GLB 파일이 다음 경로에 저장되었습니다: ${filePath}`);
        } else {
            console.log("모델 파일 URL이 결과에 포함되지 않았습니다.");
        }
        
    } catch (error)
        {console.error("오류가 발생했습니다:", error);
    }
}

main();