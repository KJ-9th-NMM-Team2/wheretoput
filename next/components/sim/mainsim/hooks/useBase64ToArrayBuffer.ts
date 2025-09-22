import { useEffect } from "react";

interface useBase64ToArrayBufferType {
    glbData: string;
    modelId: string;
    setGlbDataUrl: (glbDataUrl: string) => void;
}

export const useBase64ToArrayBuffer = ({glbData, modelId, setGlbDataUrl}: useBase64ToArrayBufferType) => {
    useEffect(() => {
        if (glbData) {
            // base64를 ArrayBuffer로 변환
            const binaryString = atob(glbData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            // Blob URL 생성
            const blob = new Blob([bytes.buffer], { type: "model/gltf-binary" });
            const url = URL.createObjectURL(blob);
            setGlbDataUrl(url);
        }
    }, [glbData, modelId]);
}