import { getUrlAndUploadDataURLToS3 } from "./api-url";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// 사진을 s3에 업로드하고, 방의 썸네일 이미지를 업데이트하는 함수
export async function postThumbnailImage(
  dataUrl: string,
  fileName: string,
  roomId: string
): Promise<any> {
  try {
    // dataURL을 파일로 변환하고, 업로드용 presigned URL 요청 및 S3에 업로드
    const newFileName = `thumbnails/${fileName}`;
    const { success, key } = await getUrlAndUploadDataURLToS3(
      dataUrl,
      newFileName
    );
    if (success && key) {
      // 업로드 성공 시, 방의 썸네일 이미지 업데이트 API 호출
      const response = await fetch(`${BASE_URL}/api/rooms/${roomId}/image`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageKey: key }),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        return {
          success: false,
          error: `Failed to update thumbnail: ${response.statusText}`,
        };
      }
    } else {
      return {
        success: false,
        error: "Image upload failed",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
