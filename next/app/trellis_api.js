// .env 에 API 키 추가하세요!
import "dotenv/config";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

import Replicate from "replicate";

// S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Prisma 클라이언트
const prisma = new PrismaClient();

// Replicate 클라이언트 설정
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// 실행할 메인 함수 (furniture_id와 imageUrl을 매개변수로 받음)
async function main(furnitureId = null, imageUrl = null) {
  try {
    // furniture 정보 가져오기 (파일명을 위해)
    let furnitureName = "output";
    if (furnitureId) {
      const furniture = await prisma.furnitures.findUnique({
        where: { furniture_id: furnitureId },
        select: { name: true },
      });
      if (furniture) {
        furnitureName = furniture.name.replace(/[^a-zA-Z0-9가-힣]/g, "_"); // 특수문자 제거
      }
    }

    console.log("Trellis 모델을 실행합니다...");
    const output = await replicate.run(
      "firtoz/trellis:06f601b67d482565d4724ae3bc29e5e8cbaa6c4594df900da315d6a02f37ce2a",
      {
        input: {
          images: [imageUrl],
          seed: 0,
          texture_size: 1024,
          mesh_simplify: 0.95,
          generate_color: true,
          generate_model: true, // 이것을 true로 설정
          randomize_seed: true,
          generate_normal: false,
          ss_sampling_steps: 12,
          slat_sampling_steps: 12,
          ss_guidance_strength: 7.5,
          slat_guidance_strength: 3,
        },
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
      const outputDir = path.join(process.cwd(), "public", "trellis");

      // 디렉토리가 없으면 생성
      fs.mkdirSync(outputDir, { recursive: true });

      // 최종 파일 경로 조합 (name 컬럼 값 사용)
      const fileName = `${furnitureName}.glb`;
      const filePath = path.join(outputDir, fileName);
      const writer = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        response.body.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      console.log(`✅ GLB 파일이 다음 경로에 저장되었습니다: ${filePath}`);

      // S3에 업로드 (name 컬럼 값 사용)
      const s3Key = `uploads/${furnitureName}.glb`;
      const s3Url = await uploadToS3(filePath, s3Key);
      console.log(`✅ S3 업로드 완료: ${s3Url}`);

      // DB에 저장
      if (furnitureId) {
        await updateFurnitureModelUrl(furnitureId, s3Url);
        console.log(`✅ DB 업데이트 완료: furniture_id ${furnitureId}`);
        return { model_url: s3Url, furniture_id: furnitureId };
      } else {
        const newFurnitureId = await saveFurnitureToDb(s3Url);
        console.log(`✅ DB 저장 완료: furniture_id ${newFurnitureId}`);
        return { model_url: s3Url, furniture_id: newFurnitureId };
      }
    } else {
      throw new Error("모델 파일 URL이 결과에 포함되지 않았습니다.");
    }
  } catch (error) {
    console.error("오류가 발생했습니다:", error);
    throw error;
  }
}

// S3 업로드 함수
async function uploadToS3(filePath, s3Key) {
  const fileContent = fs.readFileSync(filePath);

  const uploadParams = {
    Bucket: "wheretoput-bucket",
    Key: s3Key,
    Body: fileContent,
    ContentType: "model/gltf-binary",
  };

  await s3Client.send(new PutObjectCommand(uploadParams));
  return `https://wheretoput-bucket.s3.ap-northeast-2.amazonaws.com/${s3Key}`;
}

// 기존 furniture 업데이트 함수
async function updateFurnitureModelUrl(furnitureId, modelUrl) {
  await prisma.furnitures.update({
    where: { furniture_id: furnitureId },
    data: { model_url: modelUrl },
  });
}

// 새 furniture 생성 함수
async function saveFurnitureToDb(modelUrl) {
  const furniture = await prisma.furnitures.create({
    data: {
      name: "Trellis Generated Model",
      description: "AI로 생성된 3D 모델",
      model_url: modelUrl,
      price: 0,
      length_x: 1,
      length_y: 1,
      length_z: 1,
      category_id: 1,
      created_at: new Date(),
    },
  });

  return furniture.furniture_id;
}

// 시뮬레이터용 3D 모델 생성 함수 (외부에서 호출 가능)
export async function generateTrellisModel(furnitureId, imageUrl) {
  try {
    const result = await main(furnitureId, imageUrl);
    return {
      success: true,
      model_url: result.model_url,
      furniture_id: furnitureId,
    };
  } catch (error) {
    console.error("Trellis 모델 생성 실패:", error);
    throw error;
  }
}

// 사용법: main(123, "image_url") - 기존 furniture_id 123에 업데이트
// 또는 main() - 새로운 furniture 레코드 생성
// main();
