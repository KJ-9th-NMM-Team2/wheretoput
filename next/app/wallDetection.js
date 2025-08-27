// Wall Detection Module - OpenCV.js를 사용한 벽 검출 알고리즘
// 사용법: import { WallDetector } from './wallDetection.js'

export class WallDetector {
  constructor() {
    this.isOpenCVReady = false
    this.loadPromise = this.loadOpenCV()
  }

  // OpenCV.js 로드
  async loadOpenCV() {
    return new Promise((resolve, reject) => {
      // 이미 로드된 경우 체크
      if (window.cv && window.cv.Mat) {
        this.isOpenCVReady = true
        resolve(true)
        return
      }
      
      // 스크립트가 이미 존재하는지 체크
      const existingScript = document.querySelector('script[src="https://docs.opencv.org/4.x/opencv.js"]')
      if (existingScript) {
        if (window.cv && window.cv.Mat) {
          this.isOpenCVReady = true
          resolve(true)
        } else {
          window.cv = window.cv || {}
          window.cv.onRuntimeInitialized = () => {
            this.isOpenCVReady = true
            resolve(true)
          }
        }
        return
      }
      
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://docs.opencv.org/4.x/opencv.js'
      script.onload = () => {
        if (window.cv && window.cv.Mat) {
          this.isOpenCVReady = true
          resolve(true)
        } else {
          window.cv = window.cv || {}
          window.cv.onRuntimeInitialized = () => {
            this.isOpenCVReady = true
            resolve(true)
          }
        }
      }
      script.onerror = () => {
        console.error('OpenCV 로드 실패')
        reject(new Error('OpenCV 로드 실패'))
      }
      document.head.appendChild(script)
    })
  }

  // 벽 검출 메인 함수
  async detectWalls(imageFile, params = {}) {
    // OpenCV 로딩 대기
    await this.loadPromise
    
    if (!this.isOpenCVReady || !window.cv) {
      throw new Error('OpenCV is not ready')
    }

    const {
      morphType = 0,      // 0: OPEN, 1: CLOSE
      canny1 = 50,        // Canny 첫번째 임계값
      canny2 = 150,       // Canny 두번째 임계값
      houghTh = 80,       // Hough 변환 임계값
      minLen = 30,        // 최소 선분 길이
      maxGap = 20         // 선분 간 최대 간격
    } = params

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          const result = this.processImage(img, {
            morphType, canny1, canny2, houghTh, minLen, maxGap
          })
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.crossOrigin = 'anonymous'
      img.src = URL.createObjectURL(imageFile)
    })
  }

  // 이미지 처리 함수
  processImage(img, params) {
    const { morphType, canny1, canny2, houghTh, minLen, maxGap } = params
    
    // 캔버스에 이미지 그리기
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    
    // OpenCV Mat 객체들 생성
    const srcImg = window.cv.imread(canvas)
    const gray = new window.cv.Mat()
    const binary = new window.cv.Mat()
    const cleaned = new window.cv.Mat()
    const edges = new window.cv.Mat()
    const lines = new window.cv.Mat()

    try {
      // 1. 그레이스케일 변환
      window.cv.cvtColor(srcImg, gray, window.cv.COLOR_RGBA2GRAY)

      // 2. 이진화 (Otsu 임계값 자동 설정)
      window.cv.threshold(
        gray,
        binary,
        0,
        255,
        window.cv.THRESH_BINARY_INV + window.cv.THRESH_OTSU
      )

      // 3. 모폴로지 연산 (노이즈 제거)
      const kernel = window.cv.Mat.ones(3, 3, window.cv.CV_8U)
      if (morphType === 0) {
        window.cv.morphologyEx(binary, cleaned, window.cv.MORPH_OPEN, kernel)
      } else {
        window.cv.morphologyEx(binary, cleaned, window.cv.MORPH_CLOSE, kernel)
      }
      kernel.delete()

      // 4. Canny 엣지 검출
      window.cv.Canny(cleaned, edges, canny1, canny2, 3, false)

      // 5. Hough Line 변환으로 직선 검출
      window.cv.HoughLinesP(edges, lines, 1, Math.PI / 180, houghTh, minLen, maxGap)

      // 6. 선분 데이터 추출
      const wallLines = this.extractLines(lines)

      // 7. 메모리 해제
      srcImg.delete()
      gray.delete()
      binary.delete()
      cleaned.delete()
      edges.delete()
      lines.delete()

      return {
        lines: wallLines,
        imageWidth: img.width,
        imageHeight: img.height,
        detectionParams: params
      }
    } catch (error) {
      // 에러 발생 시 메모리 해제
      srcImg.delete()
      gray.delete()
      binary.delete()
      cleaned.delete()
      edges.delete()
      lines.delete()
      throw error
    }
  }

  // 선분 데이터 추출
  extractLines(lines) {
    const wallLines = []
    for (let i = 0; i < lines.rows; i++) {
      const lineData = lines.data32S.slice(i * 4, (i + 1) * 4)
      const [x1, y1, x2, y2] = lineData
      wallLines.push({ x1, y1, x2, y2 })
    }
    return wallLines
  }

  // 선분 필터링 (길이, 각도 기준)
  filterLines(lines, minLength = 20, angleThreshold = 10) {
    return lines.filter(line => {
      const length = Math.sqrt(
        Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2)
      )
      
      // 길이 필터
      if (length < minLength) return false
      
      // 각도 필터 (수직/수평 선분만)
      const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180 / Math.PI
      const normalizedAngle = Math.abs(angle % 90)
      
      return normalizedAngle < angleThreshold || normalizedAngle > (90 - angleThreshold)
    })
  }

  // 선분 병합 (인접한 선분들을 하나로)
  mergeLines(lines, distanceThreshold = 20, angleThreshold = 5) {
    const merged = []
    const used = new Set()
    
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue
      
      const line1 = lines[i]
      const group = [line1]
      used.add(i)
      
      for (let j = i + 1; j < lines.length; j++) {
        if (used.has(j)) continue
        
        const line2 = lines[j]
        if (this.areLinesSimilar(line1, line2, distanceThreshold, angleThreshold)) {
          group.push(line2)
          used.add(j)
        }
      }
      
      // 그룹의 선분들을 하나로 병합
      merged.push(this.mergeSimilarLines(group))
    }
    
    return merged
  }

  // 두 선분이 비슷한지 판단
  areLinesSimilar(line1, line2, distanceThreshold, angleThreshold) {
    // 각도 비교
    const angle1 = Math.atan2(line1.y2 - line1.y1, line1.x2 - line1.x1)
    const angle2 = Math.atan2(line2.y2 - line2.y1, line2.x2 - line2.x1)
    const angleDiff = Math.abs(angle1 - angle2) * 180 / Math.PI
    
    if (angleDiff > angleThreshold && angleDiff < (180 - angleThreshold)) {
      return false
    }
    
    // 거리 비교 (선분 중점 간 거리)
    const center1 = { x: (line1.x1 + line1.x2) / 2, y: (line1.y1 + line1.y2) / 2 }
    const center2 = { x: (line2.x1 + line2.x2) / 2, y: (line2.y1 + line2.y2) / 2 }
    const distance = Math.sqrt(
      Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
    )
    
    return distance < distanceThreshold
  }

  // 비슷한 선분들을 하나로 병합
  mergeSimilarLines(lines) {
    if (lines.length === 1) return lines[0]
    
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    lines.forEach(line => {
      minX = Math.min(minX, line.x1, line.x2)
      maxX = Math.max(maxX, line.x1, line.x2)
      minY = Math.min(minY, line.y1, line.y2)
      maxY = Math.max(maxY, line.y1, line.y2)
    })
    
    return { x1: minX, y1: minY, x2: maxX, y2: maxY }
  }

  // 기본 파라미터 반환
  static getDefaultParams() {
    return {
      morphType: 0,
      canny1: 50,
      canny2: 150,
      houghTh: 80,
      minLen: 30,
      maxGap: 20
    }
  }
}

// React Hook 버전 (기존 코드와 호환) - React import 필요
let React = null

// React hooks가 사용 가능한 경우에만 export
export function useWallDetection() {
  // React가 없으면 에러
  if (!React) {
    try {
      React = await import('react')
    } catch (e) {
      throw new Error('React is required for useWallDetection hook')
    }
  }
  
  const [isReady, setIsReady] = React.useState(false)
  const detectorRef = React.useRef(null)
  
  React.useEffect(() => {
    if (!detectorRef.current) {
      detectorRef.current = new WallDetector()
      
      // OpenCV 로딩 상태 추적
      detectorRef.current.loadPromise.then(() => {
        setIsReady(true)
      }).catch(() => {
        setIsReady(false)
      })
    }
  }, [])
  
  const detectWalls = React.useCallback(async (imageFile, params = {}) => {
    if (!detectorRef.current) {
      throw new Error('WallDetector not initialized')
    }
    return await detectorRef.current.detectWalls(imageFile, params)
  }, [])
  
  return {
    detectWalls,
    isOpenCVReady: isReady
  }
}

// 기본 export (클래스 방식으로 사용 시)
export default WallDetector