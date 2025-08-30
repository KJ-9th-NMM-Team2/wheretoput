// s3 키를 입력하면, 다운로드 가능한 presigned url을 반환.

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

const getFileUrl = async (s3Key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
  });

  // 1시간 동안 유효한 URL 생성
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export default getFileUrl;
