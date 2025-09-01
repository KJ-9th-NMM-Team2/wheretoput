import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import getFileUrl from "./getFileUrl";

/**
 * AWS S3 클라이언트 인스턴스
 * 환경변수에서 AWS 자격증명과 리전 정보를 가져와 초기화
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * @swagger
 * /api/upload-url:
 *   post:
 *     summary: S3 파일 업로드용 presigned URL 생성
 *     description: AWS S3에 파일을 업로드하기 위한 presigned URL을 생성합니다.
 *     tags:
 *       - File Upload
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: 업로드할 파일의 이름
 *                 example: "example.jpg"
 *               fileType:
 *                 type: string
 *                 description: 파일의 MIME 타입
 *                 example: "image/jpeg"
 *     responses:
 *       200:
 *         description: Presigned URL 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                   description: S3 업로드용 presigned URL
 *                   example: "https://bucket.s3.amazonaws.com/uploads/example.jpg?..."
 *                 key:
 *                   type: string
 *                   description: S3 객체 키
 *                   example: "uploads/example.jpg"
 *       400:
 *         description: 잘못된 요청 (필수 파라미터 누락)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "fileName이나 fileType이 없음"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "presigned URL 생성 실패"
 */
export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return Response.json(
        { error: "fileName이나 fileType이 없음" },
        { status: 400 }
      );
    }

    const key = `uploads/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return Response.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error("presigned URL 생성 실패:", error);
    return Response.json({ error: "presigned URL 생성 실패" }, { status: 500 });
  }
}
