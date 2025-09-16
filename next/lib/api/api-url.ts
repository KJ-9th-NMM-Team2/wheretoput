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

export const getUrlAndUploadToS3 = async (
  file: File
): Promise<{ success: boolean; key?: string }> => {
  try {
    // 1. 업로드용 presigned URL 요청
    const { uploadUrl, key } = await getUploadUrl(file.name, file.type);
    // 2. presigned URL을 사용해 S3에 파일 업로드
    const success = await uploadFileToS3(uploadUrl, file, file.type);
    return { success, key: success ? key : undefined };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false };
  }
};

// dataURL을 File로 변환하는 함수
const dataURLToFile = (dataURL: string, fileName: string): File => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};

// dataURL을 S3에 업로드하는 함수
export const getUrlAndUploadDataURLToS3 = async (
  dataURL: string,
  fileName: string
): Promise<{ success: boolean; key?: string }> => {
  try {
    // 1. dataURL을 File로 변환
    const file = dataURLToFile(dataURL, fileName);
    
    // 2. 기존 업로드 로직 재사용
    const { uploadUrl, key } = await getUploadUrl(file.name, file.type);
    const success = await uploadFileToS3(uploadUrl, file, file.type);
    
    return { success, key: success ? key : undefined };
  } catch (error) {
    console.error("Error uploading dataURL:", error);
    return { success: false };
  }
};

// key를 이용해 S3에서 파일 다운로드 -> downloadUrl을 json에 포함해 반환
export const downloadFileFromS3 = async (key: string) => {
  const response = await fetch(`${BASE_URL}/api/upload-url/${key}`);
  if (!response.ok) {
    throw new Error("Failed to get download URL");
  }

  return response.json();
};

// S3 URL을 CDN URL로 변환하는 함수
export const convertS3ToCdnUrl = (s3Url: string): string => {
  if (!s3Url) return s3Url;

  const s3Pattern = /https:\/\/wheretoput-bucket\.s3\.ap-northeast-2\.amazonaws\.com\/(.*)/;
  const match = s3Url.match(s3Pattern);

  if (match) {
    const path = match[1];
    return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${path}`;
  }

  return s3Url;
};
