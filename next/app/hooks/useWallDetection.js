import { useState, useEffect, useRef, useCallback } from "react";

// Wall Detection Hook - React 전용
export function useWallDetection() {
  const [isOpenCVReady, setIsOpenCVReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const detectorRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadOpenCV = async () => {
      try {
        // 이미 로드된 경우 체크
        if (window.cv && window.cv.Mat) {
          if (mounted) {
            setIsOpenCVReady(true);
            setIsLoading(false);
          }
          return;
        }

        // 스크립트가 이미 존재하는지 체크
        let existingScript = document.querySelector(
          'script[src="https://docs.opencv.org/4.x/opencv.js"]'
        );

        if (!existingScript) {
          // 새 스크립트 생성
          const script = document.createElement("script");
          script.async = true;
          script.src = "https://docs.opencv.org/4.x/opencv.js";
          document.head.appendChild(script);
          existingScript = script;
        }

        // OpenCV 로딩 대기
        await new Promise((resolve, reject) => {
          const checkOpenCV = () => {
            if (window.cv && window.cv.Mat) {
              resolve();
            } else if (window.cv) {
              window.cv.onRuntimeInitialized = resolve;
            } else {
              // cv가 아직 정의되지 않은 경우
              setTimeout(checkOpenCV, 100);
            }
          };

          existingScript.onload = checkOpenCV;
          existingScript.onerror = () => reject(new Error("OpenCV 로드 실패"));

          // 이미 로드된 스크립트인 경우
          if (existingScript.readyState === "complete") {
            checkOpenCV();
          }
        });

        if (mounted) {
          setIsOpenCVReady(true);
          setIsLoading(false);
          // console.log('✅ OpenCV.js 로드 완료')
        }
      } catch (error) {
        console.error("❌ OpenCV 로드 실패:", error);
        if (mounted) {
          setIsOpenCVReady(false);
          setIsLoading(false);
        }
      }
    };

    loadOpenCV();

    return () => {
      mounted = false;
    };
  }, []);

  const detectWalls = useCallback(
    async (imageFile, params = {}) => {
      if (!isOpenCVReady || !window.cv) {
        throw new Error("OpenCV is not ready");
      }

      const {
        morphType = 0,
        canny1 = 50,
        canny2 = 150,
        houghTh = 80,
        minLen = 30,
        maxGap = 20,
      } = params;

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const srcImg = window.cv.imread(canvas);
            const gray = new window.cv.Mat();
            const binary = new window.cv.Mat();
            const cleaned = new window.cv.Mat();
            const edges = new window.cv.Mat();
            const lines = new window.cv.Mat();

            // 1. 그레이스케일
            window.cv.cvtColor(srcImg, gray, window.cv.COLOR_RGBA2GRAY);

            // 2. 이진화 (Otsu)
            window.cv.threshold(
              gray,
              binary,
              0,
              255,
              window.cv.THRESH_BINARY_INV + window.cv.THRESH_OTSU
            );

            // 3. 모폴로지
            const kernel = window.cv.Mat.ones(3, 3, window.cv.CV_8U);
            if (morphType === 0) {
              window.cv.morphologyEx(
                binary,
                cleaned,
                window.cv.MORPH_OPEN,
                kernel
              );
            } else {
              window.cv.morphologyEx(
                binary,
                cleaned,
                window.cv.MORPH_CLOSE,
                kernel
              );
            }

            // 4. Canny
            window.cv.Canny(cleaned, edges, canny1, canny2, 3, false);

            // 5. HoughLinesP
            window.cv.HoughLinesP(
              edges,
              lines,
              1,
              Math.PI / 180,
              houghTh,
              minLen,
              maxGap
            );

            // 선분 데이터 추출
            const wallLines = [];
            for (let i = 0; i < lines.rows; i++) {
              const lineData = lines.data32S.slice(i * 4, (i + 1) * 4);
              const [x1, y1, x2, y2] = lineData;
              wallLines.push({ x1, y1, x2, y2 });
            }

            // 메모리 해제
            srcImg.delete();
            gray.delete();
            binary.delete();
            cleaned.delete();
            edges.delete();
            lines.delete();
            kernel.delete();

            resolve({
              lines: wallLines,
              imageWidth: img.width,
              imageHeight: img.height,
            });
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.crossOrigin = "anonymous";
        img.src = URL.createObjectURL(imageFile);
      });
    },
    [isOpenCVReady]
  );

  return {
    detectWalls,
    isOpenCVReady,
    isLoading,
  };
}
