// Wall Detection Module - OpenCV.js를 사용한 벽 검출 알고리즘
// HTML 예제 기반으로 최적화된 버전

import { useState, useRef, useEffect, useCallback } from 'react'

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

  // 이미지 처리 함수 (HTML 예제 기반)
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
      let wallLines = this.extractLines(lines)

      // 7. 평행선 병합 및 후처리
      wallLines = this.mergeParallelLines(wallLines)
      wallLines = this.filterLines(wallLines)

      // 8. 메모리 해제
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

  // 선분 데이터 추출 (HTML 예제와 동일)
  extractLines(lines) {
    const wallLines = []
    for (let i = 0; i < lines.rows; i++) {
      const linePtr = lines.intPtr(i)
      const [x1, y1, x2, y2] = [linePtr[0], linePtr[1], linePtr[2], linePtr[3]]
      wallLines.push({ x1, y1, x2, y2 })
    }
    return wallLines
  }

  // 평행선 병합 (벽 두께 문제 해결)
  mergeParallelLines(lines, maxDistance = 15, angleThreshold = 5) {
    const merged = []
    const used = new Set()
    
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue
      
      const line1 = lines[i]
      const parallelGroup = [line1]
      used.add(i)
      
      // 평행한 선들 찾기
      for (let j = i + 1; j < lines.length; j++) {
        if (used.has(j)) continue
        
        const line2 = lines[j]
        if (this.areParallelLines(line1, line2, maxDistance, angleThreshold)) {
          parallelGroup.push(line2)
          used.add(j)
        }
      }
      
      // 평행선들의 중심선 계산
      if (parallelGroup.length > 1) {
        merged.push(this.calculateCenterLine(parallelGroup))
      } else {
        merged.push(line1)
      }
    }
    
    return merged
  }

  // 두 선이 평행한지 확인
  areParallelLines(line1, line2, maxDistance, angleThreshold) {
    // 각도 비교
    const angle1 = Math.atan2(line1.y2 - line1.y1, line1.x2 - line1.x1) * 180 / Math.PI
    const angle2 = Math.atan2(line2.y2 - line2.y1, line2.x2 - line2.x1) * 180 / Math.PI
    
    let angleDiff = Math.abs(angle1 - angle2)
    if (angleDiff > 90) angleDiff = 180 - angleDiff
    
    if (angleDiff > angleThreshold) return false
    
    // 평행선 간의 거리 계산
    const distance = this.distanceBetweenParallelLines(line1, line2)
    return distance <= maxDistance
  }

  // 평행선 간의 거리 계산
  distanceBetweenParallelLines(line1, line2) {
    // line1의 중점에서 line2까지의 거리
    const midX1 = (line1.x1 + line1.x2) / 2
    const midY1 = (line1.y1 + line1.y2) / 2
    
    // line2를 직선의 일반형으로 변환 (ax + by + c = 0)
    const a = line2.y2 - line2.y1
    const b = line2.x1 - line2.x2
    const c = line2.x2 * line2.y1 - line2.x1 * line2.y2
    
    // 점에서 직선까지의 거리 공식
    return Math.abs(a * midX1 + b * midY1 + c) / Math.sqrt(a * a + b * b)
  }

  // 평행선들의 중심선 계산
  calculateCenterLine(parallelLines) {
    // 모든 선의 시작점과 끝점을 수집
    const points = []
    parallelLines.forEach(line => {
      points.push({ x: line.x1, y: line.y1 })
      points.push({ x: line.x2, y: line.y2 })
    })
    
    // 주요 방향 벡터 계산 (첫 번째 선 기준)
    const mainLine = parallelLines[0]
    const dx = mainLine.x2 - mainLine.x1
    const dy = mainLine.y2 - mainLine.y1
    const length = Math.sqrt(dx * dx + dy * dy)
    const dirX = dx / length
    const dirY = dy / length
    
    // 모든 점을 주요 방향으로 투영
    const projections = points.map(point => {
      return (point.x - mainLine.x1) * dirX + (point.y - mainLine.y1) * dirY
    })
    
    const minProj = Math.min(...projections)
    const maxProj = Math.max(...projections)
    
    // 중심선의 시작점과 끝점 계산
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length
    
    // 중심점에서 주요 방향으로 선을 그어 시작점과 끝점 결정
    const startX = centerX + (minProj - (centerX - mainLine.x1) * dirX - (centerY - mainLine.y1) * dirY) * dirX
    const startY = centerY + (minProj - (centerX - mainLine.x1) * dirX - (centerY - mainLine.y1) * dirY) * dirY
    const endX = centerX + (maxProj - (centerX - mainLine.x1) * dirX - (centerY - mainLine.y1) * dirY) * dirX
    const endY = centerY + (maxProj - (centerX - mainLine.x1) * dirX - (centerY - mainLine.y1) * dirY) * dirY
    
    return {
      x1: Math.round(startX),
      y1: Math.round(startY),
      x2: Math.round(endX),
      y2: Math.round(endY)
    }
  }

  // 선분 필터링 (길이, 각도 기준)
  filterLines(lines, minLength = 80, angleThreshold = 5) {
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

// React Hook 버전
export function useWallDetection() {
  const [isReady, setIsReady] = useState(false)
  const detectorRef = useRef(null)
  
  useEffect(() => {
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
  
  const detectWalls = useCallback(async (imageFile, params = {}) => {
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