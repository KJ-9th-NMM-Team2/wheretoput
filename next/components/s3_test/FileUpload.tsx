"use client";

import { useState } from "react";
import {
  getUploadUrl,
  uploadFileToS3,
  downloadFileFromS3,
} from "@/lib/api/api-url";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedKey, setuploadedKey] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getFileType = (file: File) => {
    const extension = file.name.toLowerCase().split(".").pop();
    switch (extension) {
      case "glb":
        return "model/gltf-binary";
      case "gltf":
        return "model/gltf+json";
      default:
        return file.type || "application/octet-stream";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const fileType = getFileType(file);

      // 1. presigned URL 요청
      const { uploadUrl, key } = await getUploadUrl(file.name, fileType);

      // 2. S3에 직접 업로드
      const uploadSuccess = await uploadFileToS3(uploadUrl, file, fileType);

      // 업로드 성공 시 파일 URL 생성
      if (uploadSuccess) {
        const fileUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
        setuploadedKey(key);
        alert("업로드 성공!");
        if (file.type.startsWith("image/")) {
          const img = document.createElement("img");
          img.src = fileUrl;
          img.alt = "Uploaded Image";
          img.style.maxWidth = "100%";
          img.style.marginTop = "16px";
          const container = document.querySelector(".p-6");
          if (container) {
            // Remove previous preview if exists
            const prevImg = container.querySelector(
              "img[alt='Uploaded Image']"
            );
            if (prevImg) prevImg.remove();
            container.appendChild(img);
          }
        } else {
          const container = document.querySelector(".p-6");
          if (container) {
            // Remove previous preview if exists
            const prevDesc = container.querySelector(
              "div[data-type='file-desc']"
            );
            if (prevDesc) prevDesc.remove();
            const desc = document.createElement("div");
            desc.setAttribute("data-type", "file-desc");
            desc.style.marginTop = "16px";
            desc.style.color = "#555";
            desc.textContent =
              "이미지가 아닌 파일입니다. 미리보기를 제공하지 않습니다.";
            container.appendChild(desc);
          }
        }
      } else {
        alert("업로드 실패");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">파일 업로드</h2>

      <input
        type="file"
        accept=".glb,.gltf,image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        {uploading ? "업로드 중..." : "업로드"}
      </button>

      {uploadedKey && (
        <div className="mt-4">
          <p className="text-green-600 font-semibold">업로드 완료!</p>
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">업로드된 파일 URL:</p>
            <a
              href={`https://wheretoput-bucket.s3.ap-northeast-2.amazonaws.com/${uploadedKey}`}
              rel="noopener noreferrer"
              className="inline-block px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors break-all"
            >
              파일 보기
            </a>
            <div className="mt-2 text-xs text-gray-500 break-all">
              {`https://wheretoput-bucket.s3.ap-northeast-2.amazonaws.com/${uploadedKey}`}
            </div>
          </div>
          <button
            onClick={() => {
              downloadFileFromS3(uploadedKey).then((res) => {
                if (res.downloadUrl) {
                  setDownloadUrl(res.downloadUrl);
                } else {
                  alert("다운로드 URL을 가져올 수 없습니다.");
                }
              });
            }}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            다운로드 링크 생성
          </button>

          {downloadUrl && (
            <div className="mt-3 p-3 bg-gray-50 border rounded-lg">
              <p className="text-sm text-gray-600 mb-2">다운로드 링크:</p>
              <a
                href={downloadUrl}
                download
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-decoration-none"
              >
                파일 다운로드
              </a>
              <p className="text-xs text-gray-500 mt-2">
                링크는 1시간 동안 유효합니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
