// types/opencv.d.ts
declare global {
    interface Window {
        cv: {
            // 기본 클래스들
            Mat: any;
            Size: any;
            Point: any;
            Scalar: any;

            // 이미지 처리 함수들
            imread: (imageId: string) => any;
            imshow: (canvasId: string, mat: any) => void;
            cvtColor: (src: any, dst: any, code: number) => void;
            threshold: (src: any, dst: any, thresh: number, maxval: number, type: number) => number;
            morphologyEx: (src: any, dst: any, op: number, kernel: any) => void;
            Canny: (src: any, dst: any, threshold1: number, threshold2: number) => void;
            HoughLinesP: (src: any, lines: any, rho: number, theta: number, threshold: number, minLineLength?: number, maxLineGap?: number) => void;

            // 모폴로지 상수들
            MORPH_OPEN: number;
            MORPH_CLOSE: number;
            MORPH_GRADIENT: number;
            MORPH_TOPHAT: number;
            MORPH_BLACKHAT: number;
            MORPH_ERODE: number;
            MORPH_DILATE: number;

            // 데이터 타입 상수들
            CV_8U: number;
            CV_8S: number;
            CV_16U: number;
            CV_16S: number;
            CV_32S: number;
            CV_32F: number;
            CV_64F: number;

            // 색상 변환 상수들
            COLOR_BGR2GRAY: number;
            COLOR_GRAY2BGR: number;
            COLOR_BGR2RGB: number;
            COLOR_RGB2BGR: number;

            // 임계값 타입들
            THRESH_BINARY: number;
            THRESH_BINARY_INV: number;
            THRESH_TRUNC: number;
            THRESH_TOZERO: number;
            THRESH_TOZERO_INV: number;
            THRESH_OTSU: number;        // 추가
            THRESH_TRIANGLE: number;    // 추가 (자주 사용됨)

            // 초기화 함수
            onRuntimeInitialized?: () => void;

            // 색상 변환 상수들 (누락된 것들 추가)
            COLOR_BGR2GRAY: number;
            COLOR_GRAY2BGR: number;
            COLOR_BGR2RGB: number;
            COLOR_RGB2BGR: number;
            COLOR_RGBA2GRAY: number;  // 추가
            COLOR_GRAY2RGBA: number;  // 추가
            COLOR_RGBA2RGB: number;   // 추가
            COLOR_RGB2RGBA: number;   // 추가
            COLOR_BGRA2GRAY: number;  // 추가
        };
    }
}

export { };