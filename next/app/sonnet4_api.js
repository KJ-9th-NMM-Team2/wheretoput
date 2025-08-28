

require('dotenv').config();

const { GLTFExporter } = require("three-stdlib");
const { writeFileSync } = require("fs");
const THREE = require("three");

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const axios = require("axios");

// PostgreSQL 연결 설정
// Host : 아마존 RDS
const pool = new Pool({
  user: process.env.DB_USER || 'wheretoput_admin',
  host: process.env.DB_HOST || 'wheretoput-db.chwouasus83g.ap-northeast-2.rds.amazonaws.com',
  database: process.env.DB_NAME || 'wheretoput_db',
  password: process.env.DB_PASSWORD || 'trustyourdata',
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// Anthropic API 키 설정
const anthropic = new Anthropic({
  apiKey: "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",
});

/**
 * PostgreSQL DB에서 image_url 가져오기
 * furniture 스키마 ->furnitures 테이블 -> furniture_id 가져옴
 */
async function getImageUrlFromDB(furnitureId) {
  try {
    const client = await pool.connect();
    
    // 스키마 경로 설정
    await client.query('SET search_path TO furniture, public');
    
    const query = 'SELECT image_url, name FROM furnitures WHERE furniture_id = $1';
    const result = await client.query(query, [furnitureId]);
    client.release();
    
    if (result.rows.length === 0) {
      throw new Error(`가구 ID ${furnitureId}를 찾을 수 없습니다.`);
    }
    
    const furniture = result.rows[0];
    console.log(`가구 정보: ${furniture.name}`);
    
    return furniture.image_url;
  } catch (error) {
    console.error('데이터베이스 조회 오류:', error);
    throw error;
  }
}

/**
 * URL에서 이미지를 다운로드하고 base64로 인코딩
 */
async function imageUrlToBase64(imageUrl) {
  try {
    console.log(`이미지 다운로드 중: ${imageUrl}`);
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30초 타임아웃
    });

    const imageBuffer = Buffer.from(response.data);
    const base64Data = imageBuffer.toString("base64");

    // Content-Type에서 MIME 타입 가져오기
    let mimeType = response.headers['content-type'];
    
    // Content-Type이 없으면 URL 확장자에서 추정
    if (!mimeType) {
      const ext = path.extname(new URL(imageUrl).pathname).toLowerCase();
      switch (ext) {
        case ".jpg":
        case ".jpeg":
          mimeType = "image/jpeg";
          break;
        case ".png":
          mimeType = "image/png";
          break;
        case ".gif":
          mimeType = "image/gif";
          break;
        case ".webp":
          mimeType = "image/webp";
          break;
        default:
          mimeType = "image/jpeg"; // 기본값
      }
    }

    console.log(`이미지 다운로드 완료. 타입: ${mimeType}, 크기: ${imageBuffer.length} bytes`);
    return { base64Data, mimeType };
  } catch (error) {
    console.error("이미지 URL 다운로드 오류:", error);
    throw error;
  }
}

/**
 * 이미지 파일을 base64로 인코딩 (로컬 파일용 - 호환성 유지)
 */
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Data = imageBuffer.toString("base64");

    const ext = path.extname(imagePath).toLowerCase();
    let mimeType;

    switch (ext) {
      case ".jpg":
      case ".jpeg":
        mimeType = "image/jpeg";
        break;
      case ".png":
        mimeType = "image/png";
        break;
      case ".gif":
        mimeType = "image/gif";
        break;
      case ".webp":
        mimeType = "image/webp";
        break;
      default:
        throw new Error(`지원되지 않는 이미지 형식: ${ext}`);
    }

    return { base64Data, mimeType };
  } catch (error) {
    console.error("이미지 파일 읽기 오류:", error);
    throw error;
  }
}

/**
 * 생성된 코드를 실행하여 Three.js 객체 생성
 */
function executeGeneratedCode(generatedCode, position = [0, 0, 0], scale = 1) {
  try {
    console.log("생성된 코드 분석 중...");
    console.log("코드 길이:", generatedCode.length);

    // 코드 정리 - 마크다운 블록 제거
    let cleanCode = generatedCode
      .replace(/```javascript/g, "")
      .replace(/```js/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("정리된 코드 길이:", cleanCode.length);

    // 함수 정의 찾기 (더 유연한 패턴)
    const functionMatches = cleanCode.match(
      /function\s+(\w+)\s*\([^)]*\)\s*\{/
    );
    if (!functionMatches) {
      console.error("함수를 찾을 수 없습니다. 코드 내용:");
      console.error(cleanCode.substring(0, 500));
      throw new Error("생성된 코드에서 함수 정의를 찾을 수 없습니다.");
    }

    const functionName = functionMatches[1];
    console.log("찾은 함수명:", functionName);

    // 함수의 전체 본문을 찾기 (중괄호 매칭)
    let braceCount = 0;
    let functionStart = cleanCode.indexOf(functionMatches[0]);
    let functionEnd = -1;

    for (let i = functionStart; i < cleanCode.length; i++) {
      if (cleanCode[i] === "{") braceCount++;
      if (cleanCode[i] === "}") {
        braceCount--;
        if (braceCount === 0) {
          functionEnd = i + 1;
          break;
        }
      }
    }

    if (functionEnd === -1) {
      throw new Error("함수의 끝을 찾을 수 없습니다.");
    }

    const functionCode = cleanCode.substring(functionStart, functionEnd);
    console.log("추출된 함수 길이:", functionCode.length);

    // 안전한 실행 환경 생성
    const executableCode = `
      'use strict';
      ${functionCode}
      
      // 함수 실행
      try {
        const result = ${functionName}([${position.join(", ")}], ${scale});
        return result;
      } catch (error) {
        throw new Error('함수 실행 중 오류: ' + error.message);
      }
    `;

    console.log("코드 실행 중...");

    // Function 생성자를 사용하여 안전하게 실행
    const result = new Function("THREE", executableCode)(THREE);

    console.log("3D 객체 생성 성공!");
    return result;
  } catch (error) {
    console.error("코드 실행 상세 오류:", error);
    console.error("스택 트레이스:", error.stack);

    // 디버깅을 위한 추가 정보
    console.log("=== 디버깅 정보 ===");
    console.log("원본 코드 일부:");
    console.log(generatedCode.substring(0, 300));

    throw error;
  }
}

/**
 * GLB 파일로 내보내기
 */
function exportGLB(object3d, filename = "output.glb") {
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      object3d,
      (result) => {
        try {
          console.log("Export result type:", typeof result, result.constructor.name);
          
          if (result instanceof ArrayBuffer) {
            // GLB 형식 (바이너리)
            writeFileSync(filename, Buffer.from(result));
            console.log(`✅ GLB 파일 생성 완료: ${filename}`);
            resolve(filename);
          } else {
            // GLTF 형식 (JSON) - GLB로 변환 시도
            console.log("GLTF 객체 감지, GLB로 변환 시도 중...");
            
            // GLTF JSON을 문자열로 변환
            const gltfString = JSON.stringify(result);
            const gltfBuffer = Buffer.from(gltfString, 'utf8');
            
            // GLB 헤더 생성 (magic: glTF, version: 2, length)
            const magic = Buffer.from('glTF', 'ascii');
            const version = Buffer.alloc(4);
            version.writeUInt32LE(2, 0);
            
            const jsonChunkLength = gltfBuffer.length;
            const totalLength = 12 + 8 + jsonChunkLength; // header + chunk header + json
            
            const length = Buffer.alloc(4);
            length.writeUInt32LE(totalLength, 0);
            
            // JSON chunk header
            const jsonLength = Buffer.alloc(4);
            jsonLength.writeUInt32LE(jsonChunkLength, 0);
            const jsonType = Buffer.from('JSON', 'ascii');
            
            // GLB 파일 조립
            const glbBuffer = Buffer.concat([
              magic, version, length,  // GLB header
              jsonLength, jsonType, gltfBuffer  // JSON chunk
            ]);
            
            writeFileSync(filename, glbBuffer);
            console.log(`✅ GLB 파일 변환 완료: ${filename}`);
            resolve(filename);
          }
        } catch (error) {
          reject(error);
        }
      },
      {
        binary: true,
        embedImages: false,
        includeCustomExtensions: false,
        forcePowerOfTwoTextures: false,
        maxTextureSize: 1024,
      }
    );
  });
}

/**
 * 이미지를 Three.js 코드로 변환 (URL 또는 로컬 파일 지원)
 */
async function convertImageToThreeJS(imageSource, outputPath = null, isUrl = false) {
  try {
    console.log("이미지를 읽는 중...");
    let base64Data, mimeType;
    
    if (isUrl) {
      ({ base64Data, mimeType } = await imageUrlToBase64(imageSource));
    } else {
      ({ base64Data, mimeType } = imageToBase64(imageSource));
    }

    console.log("Anthropic API 요청 중...");
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `가구 분석: - 이미지의 가구 종류, 형태, 비례, 색상을 파악 

다음 형식으로 작성해주세요:
- 순수 Three.js 코드 (함수 형태)
- 기존 scene에 추가할 수 있는 독립적인 모델
- 이미지의 주요 객체를 3D로 재현
- **모든 구성 요소는 하나의 Group으로 결합하여 단일 객체로 생성**
- **각 부품의 위치는 Group 내 상대좌표로 정확히 배치**
- **연결 부분은 겹치거나 관통하도록 배치하여 완전히 결합**
- 둥근 모서리나 곡면 처리
- **재질은 반드시 MeshBasicMaterial 또는 MeshStandardMaterial만 사용**
- 적절한 색상과 재질 적용
- position, scale 매개변수 포함
- 반환값은 생성된 mesh 또는 group

**중요: 모든 부품이 물리적으로 연결되어 하나의 완성된 가구가 되도록 위치 조정**

예시 형식:
function createObjectFromImage(position = [0, 0, 0], scale = 1) {
    const group = new THREE.Group();
    // 각 부품을 그룹 내 정확한 위치에 배치
    // 예: 책상 다리와 상판이 완전히 연결되도록
    group.position.set(...position);
    group.scale.setScalar(scale);
    return group;
}

함수 코드만 출력하고 다른 설명은 생략해주세요.`,
            },
          ],
        },
      ],
    });

    const generatedCode = response.content[0].text;

    // 출력 파일 경로가 지정된 경우 파일로 저장
    if (outputPath) {
      console.log(`코드를 파일로 저장 중: ${outputPath}`);
      fs.writeFileSync(outputPath, generatedCode, "utf8");
      console.log("파일 저장 완료!");
    }

    console.log("변환 완료!");
    return generatedCode;
  } catch (error) {
    console.error("변환 오류:", error);
    throw error;
  }
}

/**
 * DB의 가구 ID로부터 GLB 파일을 생성하는 함수
 */
async function convertFurnitureIdToGLB(
  furnitureId,
  glbFilename = "output.glb",
  position = [0, 0, 0],
  scale = 1
) {
  try {
    console.log("=== DB에서 가구 이미지 URL 가져오는 중 ===");
    const imageUrl = await getImageUrlFromDB(furnitureId);
    
    return await convertImageToGLB(imageUrl, glbFilename, position, scale, true);
  } catch (error) {
    console.error("가구 ID 변환 과정에서 오류 발생:", error);
    throw error;
  }
}

/**
 * 이미지에서 GLB 파일로 직접 변환하는 통합 함수
 */
async function convertImageToGLB(
  imageSource,
  glbFilename = "output.glb",
  position = [0, 0, 0],
  scale = 1,
  isUrl = false
) {
  try {
    console.log("=== 이미지를 GLB로 변환 시작 ===");

    // 1. 이미지를 Three.js 코드로 변환
    const generatedCode = await convertImageToThreeJS(imageSource, null, isUrl);

    console.log("\n=== 생성된 Three.js 코드 ===");
    console.log(generatedCode);

    // 2. 생성된 코드를 파일로 저장 (디버깅용)
    const codeFilename = glbFilename.replace(".glb", "_code.js");
    fs.writeFileSync(codeFilename, generatedCode, "utf8");
    console.log(`코드를 파일로 저장: ${codeFilename}`);

    // 3. 생성된 코드를 실행하여 3D 객체 생성
    console.log("\n3D 객체 생성 중...");
    let object3d;

    try {
      object3d = executeGeneratedCode(generatedCode, position, scale);
    } catch (codeError) {
      console.error("자동 코드 실행 실패:", codeError.message);
      console.log("\n=== 수동 실행 가이드 ===");
      console.log(`1. 생성된 코드 파일을 확인하세요: ${codeFilename}`);
      console.log(
        "2. 코드를 수정한 후 다음과 같이 수동으로 실행할 수 있습니다:"
      );
      console.log(`
const THREE = require('three');
// ${codeFilename} 파일의 함수를 복사하여 여기에 붙여넣기

const object = 함수명([${position.join(", ")}], ${scale});
// 그 다음 exportGLB(object, "${glbFilename}"); 실행
      `);

      // 간단한 대체 객체 생성 (테스트용)
      console.log("테스트용 간단한 박스를 생성합니다...");
      object3d = createFallbackObject(position, scale);
    }

    // 4. 3D 객체를 GLB 파일로 내보내기
    console.log("GLB 파일로 내보내는 중...");
    await exportGLB(object3d, glbFilename);

    console.log(`\n=== 변환 완료! ===`);
    console.log(`입력: ${imageSource}`);
    console.log(`출력: ${glbFilename}`);
    console.log(`코드: ${codeFilename}`);

    return {
      code: generatedCode,
      object: object3d,
      filename: glbFilename,
      codeFile: codeFilename,
    };
  } catch (error) {
    console.error("변환 과정에서 오류 발생:", error);
    throw error;
  }
}

/**
 * 대체용 간단한 3D 객체 생성 (코드 실행 실패 시 사용)
 */
function createFallbackObject(position = [0, 0, 0], scale = 1) {
  const group = new THREE.Group();

  // 간단한 박스 생성
  const geometry = new THREE.BoxGeometry(2, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
  const mesh = new THREE.Mesh(geometry, material);

  group.add(mesh);
  group.position.set(...position);
  group.scale.setScalar(scale);

  console.log("대체 객체(박스) 생성 완료");
  return group;
}

// 사용 예시 - DB 가구 ID 사용
async function mainWithDB() {
  try {
    // DB에서 가구 ID로 변환 (UUID 사용)
    const furnitureId = "0537ef3f-e148-4296-8da3-f9a5acaa9671"; // PostgreSQL의 furniture_id (UUID)
    const glbFilename = "./furniture_from_db.glb"; // 생성할 GLB 파일명

    // DB 가구 ID를 GLB로 변환
    const result = await convertFurnitureIdToGLB(
      furnitureId,
      glbFilename,
      [0, 0, 0], // 위치
      1 // 크기
    );

    console.log("DB 가구 변환 성공!");
  } catch (error) {
    console.error("DB 메인 함수 실행 오류:", error);
  }
}

// 사용 예시 - 로컬 파일
async function main() {
  try {
    // 이미지 파일 경로와 출력할 GLTF 파일명 지정
    const imagePath = "C:\\Users\\zx546\\Desktop\\wheretoput\\next\\public\\asset\\chair.jpg"; // 변환할 이미지 파일
    const glbFilename = "C:\\Users\\zx546\\Desktop\\wheretoput\\next\\public\\asset\\chair.glb"; // 생성할 glb 파일명

    // 이미지를 GLB로 변환
    const result = await convertImageToGLB(
      imagePath,
      glbFilename,
      [0, 0, 0], // 위치
      1 // 크기
    );

    console.log("변환 성공!");
  } catch (error) {
    console.error("메인 함수 실행 오류:", error);
  }
}

// 모듈로 내보내기
module.exports = {
  convertImageToThreeJS,
  convertImageToGLB,
  convertFurnitureIdToGLB,
  getImageUrlFromDB,
  exportGLB,
  executeGeneratedCode,
  createFallbackObject,
  imageToBase64,
  imageUrlToBase64,
};

// 직접 실행 시 main 함수 호출
if (require.main === module) {
  // mainWithDB(); // DB를 사용하려면 이 주석을 해제하고 main()을 주석 처리
  main();
}