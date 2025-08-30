interface UploadUrlRequest {
  fileName: string;
  fileType: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// 업로드용 presigned URL 요청 -> presigned URL과 S3 객체 키를 반환
export const getUploadUrl = async (
  fileName: string,
  fileType: string
): Promise<UploadUrlResponse> => {
  const response = await fetch(`${BASE_URL}/api/upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      fileType,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get upload URL");
  }

  return response.json();
};

// presigned URL을 사용해 S3에 파일 업로드
export const uploadFileToS3 = async (
  uploadUrl: string,
  file: File,
  fileType: string
): Promise<boolean> => {
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": fileType,
    },
  });

  return uploadResponse.ok;
};

// key를 이용해 S3에서 파일 다운로드 -> downloadUrl을 json에 포함해 반환
export const downloadFileFromS3 = async (key: string) => {
  const response = await fetch(`${BASE_URL}/api/upload-url/${key}`);
  if (!response.ok) {
    throw new Error("Failed to get download URL");
  }

  return response.json();
};
