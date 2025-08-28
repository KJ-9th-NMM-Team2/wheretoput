import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WallDetector } from '../wallDetection.js';

import {
  Square,
  MousePointer,
  Eraser,
  Check,
  Upload,
  Trash2,
} from "lucide-react";

const FloorPlanEditor = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState("wall");
  const [walls, setWalls] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedWall, setSelectedWall] = useState(null);
  const fileInputRef = useRef(null);

  // 축척 설정 관련 상태
  const [showScalePopup, setShowScalePopup] = useState(false);
  const [scaleImage, setScaleImage] = useState(null);
  const [scalePoints, setScalePoints] = useState([]);
  const [realLength, setRealLength] = useState('');
  const [pixelToMmRatio, setPixelToMmRatio] = useState(20); // 1픽셀 = 20mm (기본값)

  const GRID_SIZE = 20; // 격자 크기 축소 (500mm당 25px)
  const CANVAS_WIDTH = 600; // 캔버스 크기 축소
  const CANVAS_HEIGHT = 300;

  // 격자에 스냅하는 함수
  const snapToGrid = (x, y) => {
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  };

  // 거리 계산 (mm 단위) - 사용자 지정 축척 사용
  const calculateDistance = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const result = Math.round(distance * pixelToMmRatio);
    
    // 디버깅 정보 (첫 번째 계산에만)
    if (Math.random() < 0.1) { // 10% 확률로 로그
      console.log('거리 계산:', {
        pixelDistance: distance.toFixed(2),
        pixelToMmRatio: pixelToMmRatio.toFixed(4),
        resultMm: result
      });
    }
    
    return result;
  };

  // 점과 선분 사이의 거리 계산
  const getDistanceToWall = (point, wall) => {
    const A = point.x - wall.start.x;
    const B = point.y - wall.start.y;
    const C = wall.end.x - wall.start.x;
    const D = wall.end.y - wall.start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    let param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = wall.start.x;
      yy = wall.start.y;
    } else if (param > 1) {
      xx = wall.end.x;
      yy = wall.end.y;
    } else {
      xx = wall.start.x + param * C;
      yy = wall.start.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 마우스 위치를 캔버스 좌표로 변환
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // DPR을 고려하지 않고 실제 표시 크기 기준으로 계산
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  // 텍스트 그리기 함수 (선 아래에 작게 표시)
  // 여기서 font-size (폰트크기) 설정
  const drawText = (ctx, text, x, y, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#333333";
    ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    
    // 텍스트 렌더링 품질 개선
    ctx.textRenderingOptimization = 'optimizeQuality';
    ctx.imageSmoothingEnabled = true;
    
    // 선 아래쪽으로 오프셋 (5px 아래)
    ctx.fillText(text, 0, 5);
    ctx.restore();
  };

  // 캔버스 그리기 : 선분 두께 등 수정
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 고해상도 렌더링 설정
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // 캔버스 실제 해상도 설정
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // CSS 크기는 원래대로 유지
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // 컨텍스트 스케일 조정
    ctx.scale(dpr, dpr);

    // 전체 캔버스 클리어
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 텍스트 렌더링 품질 개선
    ctx.textRenderingOptimization = 'optimizeQuality';
    ctx.imageSmoothingEnabled = false; // 격자는 선명하게

    // 격자 그리기 - 픽셀 정렬로 선명하게
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.7;
    
    // 픽셀 정렬을 위해 0.5 오프셋
    ctx.translate(0.5, 0.5);

    // 세로선
    for (let x = 0; x <= rect.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(Math.floor(x), 0);
      ctx.lineTo(Math.floor(x), rect.height);
      ctx.stroke();
    }

    // 가로선
    for (let y = 0; y <= rect.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, Math.floor(y));
      ctx.lineTo(rect.width, Math.floor(y));
      ctx.stroke();
    }
    
    // 오프셋 복원
    ctx.translate(-0.5, -0.5);

    // 완성된 벽들 그리기
    ctx.strokeStyle = "#ff6600";
    ctx.lineWidth = 6;

    walls.forEach((wall) => {
      // 선택된 벽인지 확인
      const isSelected = selectedWall?.id === wall.id;
      
      // 벽 그리기 (선택된 벽은 다른 색상)
      ctx.strokeStyle = isSelected ? "#00ff00" : "#ff6600";
      ctx.lineWidth = isSelected ? 8 : 3;
      
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();

      // 길이 표시 (선 아래에 작게)
      const midX = (wall.start.x + wall.end.x) / 2;
      const midY = (wall.start.y + wall.end.y) / 2;
      const distance = calculateDistance(wall.start, wall.end);
      const angle = Math.atan2(
        wall.end.y - wall.start.y,
        wall.end.x - wall.start.x
      );

      drawText(ctx, `${distance}mm`, midX, midY, angle);
    });

    // 현재 그리고 있는 벽 그리기
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = "#ff9933";
      ctx.lineWidth = 8;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // 현재 그리고 있는 벽의 길이 표시 (선 아래에 작게)
      const midX = (startPoint.x + currentPoint.x) / 2;
      const midY = (startPoint.y + currentPoint.y) / 2;
      const distance = calculateDistance(startPoint, currentPoint);
      const angle = Math.atan2(
        currentPoint.y - startPoint.y,
        currentPoint.x - startPoint.x
      );

      // 임시 벽의 치수는 조금 다른 색상으로 표시
      ctx.save();
      ctx.fillStyle = "#ff9933";
      drawText(ctx, `${distance}mm`, midX, midY, angle);
      ctx.restore();
    }
  };

  // 마우스 이벤트 핸들러들
  const handleMouseDown = (e) => {
    const coords = getCanvasCoordinates(e);

    if (tool === "wall") {
      const snapped = snapToGrid(coords.x, coords.y);
      setStartPoint(snapped);
      setCurrentPoint(snapped);
      setIsDrawing(true);
    } else if (tool === "select") {
      // 선택 도구: 클릭한 위치에서 가장 가까운 벽 선택
      let closestWall = null;
      let closestDistance = Infinity;
      const MAX_SELECT_DISTANCE = 30; // 30픽셀 이내의 벽만 선택 가능

      walls.forEach((wall) => {
        const distance = getDistanceToWall(coords, wall);
        if (distance < closestDistance && distance < MAX_SELECT_DISTANCE) {
          closestDistance = distance;
          closestWall = wall;
        }
      });

      if (closestWall) {
        setSelectedWall(selectedWall?.id === closestWall.id ? null : closestWall);
      } else {
        setSelectedWall(null);
      }
    } else if (tool === "eraser") {
      // 클릭 위치에서 가장 가까운 벽 찾기
      let closestWall = null;
      let closestDistance = Infinity;
      const MAX_DELETE_DISTANCE = 20; // 20픽셀 이내의 벽만 삭제 가능

      walls.forEach((wall) => {
        const distance = getDistanceToWall(coords, wall);
        if (distance < closestDistance && distance < MAX_DELETE_DISTANCE) {
          closestDistance = distance;
          closestWall = wall;
        }
      });

      // 가장 가까운 벽 삭제
      if (closestWall) {
        setWalls((prev) => prev.filter((wall) => wall.id !== closestWall.id));
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawing && tool === "wall") {
      const coords = getCanvasCoordinates(e);
      const snapped = snapToGrid(coords.x, coords.y);
      setCurrentPoint(snapped);
    }
  };

  const handleMouseUp = (e) => {
    if (isDrawing && tool === "wall" && startPoint) {
      const coords = getCanvasCoordinates(e);
      const snapped = snapToGrid(coords.x, coords.y);

      // 시작점과 끝점이 다를 때만 벽 추가
      if (startPoint.x !== snapped.x || startPoint.y !== snapped.y) {
        const newWall = {
          id: Date.now(),
          start: startPoint,
          end: snapped,
        };

        setWalls((prev) => [...prev, newWall]);
      }

      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };


  // 캔버스 다시 그리기
  useEffect(() => {
    drawCanvas();
  }, [walls, isDrawing, startPoint, currentPoint, selectedWall]);

  // 이미지 업로드 처리
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 축척 설정을 위한 팝업 표시
    const imageUrl = URL.createObjectURL(file);
    setScaleImage({ file, url: imageUrl });
    setShowScalePopup(true);
    setScalePoints([]);
    setRealLength('');
  };

  // 축척 설정 완료 후 벽 검출
  const processImageWithScale = async () => {
    if (!scaleImage || scalePoints.length !== 2 || !realLength) {
      alert('축척 설정을 완료해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      // 화면 좌표를 캔버스 좌표계로 변환하기 위한 스케일 계산
      const popupImg = document.querySelector('img[alt="축척 설정용 이미지"]');
      const popupRect = popupImg?.getBoundingClientRect();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      // 팝업 이미지에서 캔버스로의 변환 비율
      const scaleToCanvas = Math.min(
        canvasRect.width / popupRect.width,
        canvasRect.height / popupRect.height
      );
      
      // 화면 좌표를 캔버스 좌표로 변환
      const canvasPoint1 = {
        x: scalePoints[0].x * scaleToCanvas,
        y: scalePoints[0].y * scaleToCanvas
      };
      const canvasPoint2 = {
        x: scalePoints[1].x * scaleToCanvas,
        y: scalePoints[1].y * scaleToCanvas
      };
      
      // 캔버스 좌표계에서의 픽셀 거리 계산
      const pixelDistance = Math.sqrt(
        Math.pow(canvasPoint2.x - canvasPoint1.x, 2) + 
        Math.pow(canvasPoint2.y - canvasPoint1.y, 2)
      );
      
      // 축척 비율 계산 (픽셀당 mm)
      const newPixelToMmRatio = parseFloat(realLength) / pixelDistance/ 1.3;
      setPixelToMmRatio(newPixelToMmRatio);

      // 디버깅 정보
      console.log('축척 설정 (수정):', {
        popupPoints: scalePoints,
        canvasPoints: [canvasPoint1, canvasPoint2],
        scaleToCanvas,
        pixelDistance,
        realLength: parseFloat(realLength),
        ratio: newPixelToMmRatio
      });

      // WallDetector로 벽 검출
      const detector = new WallDetector();
      const result = await detector.detectWalls(scaleImage.file, {
        morphType: 0,      // OPEN 연산으로 노이즈 제거
        canny1: 50,        // 낮은 임계값
        canny2: 100,       // 높은 임계값
        houghTh: 60,       // Hough 변환 임계값 낮춤
        minLen: 25,        // 최소 선분 길이
        maxGap: 15         // 선분 간 최대 간격
      });
      
      // 이미지 크기를 캔버스 크기에 맞춰 스케일 계산
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / result.imageWidth;
      const scaleY = rect.height / result.imageHeight;
      
      // 검출된 선분들을 벽으로 변환하고 격자에 스냅
      const detectedWalls = result.lines.map((line, index) => {
        // 스케일 적용
        const scaledStart = {
          x: line.x1 * scaleX,
          y: line.y1 * scaleY
        };
        const scaledEnd = {
          x: line.x2 * scaleX,
          y: line.y2 * scaleY
        };
        
        // 격자에 스냅
        const snappedStart = snapToGrid(scaledStart.x, scaledStart.y);
        const snappedEnd = snapToGrid(scaledEnd.x, scaledEnd.y);
        
        return {
          id: Date.now() + index,
          start: snappedStart,
          end: snappedEnd
        };
      });
      
      setWalls(detectedWalls);
      setUploadedImage(scaleImage.url);
      setShowScalePopup(false);
      
      alert(`축척이 설정되었습니다! (1픽셀 = ${newPixelToMmRatio.toFixed(2)}mm)`);
      
    } catch (error) {
      console.error('Wall detection failed:', error);
      alert('벽 검출에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 전체 벽 지우기 함수
  const clearAllWalls = () => {
    if (walls.length === 0) {
      alert('지울 벽이 없습니다.');
      return;
    }
    
    if (window.confirm(`모든 벽을 삭제하시겠습니까? (총 ${walls.length}개)`)) {
      setWalls([]);
      setSelectedWall(null);
      alert('모든 벽이 삭제되었습니다.');
    }
  };

  // PNG 다운로드 함수
  const downloadAsPNG = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `floor-plan-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // 완성 버튼 핸들러
  const handleComplete = () => {
    downloadAsPNG();
    alert(`도면이 완성되어 PNG 파일로 저장되었습니다! 총 ${walls.length}개의 벽이 그려졌습니다.`);
  };


  return (
    <div className="w-full h-screen bg-orange-50 flex flex-col">
      {/* 축척 설정 팝업 */}
      {showScalePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold text-orange-800 mb-4">축척 설정</h2>
            
            {/* 이미지 표시 */}
            <div className="mb-4 relative">
              <div className="border-2 border-orange-200 rounded-lg overflow-hidden bg-white relative">
                <img
                  src={scaleImage?.url}
                  alt="축척 설정용 이미지"
                  className="w-full max-h-96 object-contain cursor-crosshair block"
                  onClick={(e) => {
                    if (scalePoints.length < 2) {
                      const rect = e.target.getBoundingClientRect();
                      
                      // 단순하게 화면 좌표 그대로 사용
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      console.log('클릭 좌표 (화면):', { x, y });
                      
                      setScalePoints([...scalePoints, { x, y }]);
                    }
                  }}
                />
                {/* 선택된 점들 표시 */}
                {scalePoints.length > 0 && (
                  <>
                    {scalePoints.map((point, index) => (
                      <div
                        key={index}
                        className="absolute w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10"
                        style={{
                          left: `${point.x}px`,
                          top: `${point.y}px`
                        }}
                      />
                    ))}
                    {scalePoints.length === 2 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
                        <line
                          x1={scalePoints[0].x}
                          y1={scalePoints[0].y}
                          x2={scalePoints[1].x}
                          y2={scalePoints[1].y}
                          stroke="red"
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700">
                {scalePoints.length === 0 && "1. 이미지에서 기준이 될 선분의 시작점을 클릭하세요"}
                {scalePoints.length === 1 && "2. 기준 선분의 끝점을 클릭하세요"}
                {scalePoints.length === 2 && "3. 아래에 실제 길이를 입력하세요"}
              </p>
            </div>

            {/* 실제 길이 입력 */}
            {scalePoints.length === 2 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-orange-700 mb-2">
                  선택한 선분의 실제 길이 (mm):
                </label>
                <input
                  type="number"
                  value={realLength}
                  onChange={(e) => setRealLength(e.target.value)}
                  placeholder="예: 3000"
                  className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  픽셀 거리: {Math.round(Math.sqrt(
                    Math.pow(scalePoints[1].x - scalePoints[0].x, 2) + 
                    Math.pow(scalePoints[1].y - scalePoints[0].y, 2)
                  ))}px
                </p>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setScalePoints([])}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={isProcessing}
              >
                다시 선택
              </button>
              <button
                onClick={() => {
                  setShowScalePopup(false);
                  setScaleImage(null);
                  setScalePoints([]);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                disabled={isProcessing}
              >
                취소
              </button>
              <button
                onClick={processImageWithScale}
                disabled={scalePoints.length !== 2 || !realLength || isProcessing}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '처리 중...' : '축척 설정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 툴바 */}
      <div className="bg-orange-100 border-b-2 border-orange-200 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-orange-800 mr-6">
            2D 도면 제작기
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => setTool("wall")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                tool === "wall"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-orange-200 text-orange-700 hover:bg-orange-300"
              }`}
            >
              <Square size={18} />벽 그리기
            </button>

            <button
              onClick={() => setTool("select")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                tool === "select"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-orange-200 text-orange-700 hover:bg-orange-300"
              }`}
            >
              <MousePointer size={18} />
              선택
            </button>

            <button
              onClick={() => setTool("eraser")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                tool === "eraser"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-orange-200 text-orange-700 hover:bg-orange-300"
              }`}
            >
              <Eraser size={18} />
              지우기
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-300 transition-colors disabled:opacity-50"
            >
              <Upload size={18} />
              {isProcessing ? '처리중...' : '도면 업로드'}
            </button>

            <button
              onClick={clearAllWalls}
              className="flex items-center gap-2 px-4 py-2 bg-red-200 text-red-700 rounded-lg font-medium hover:bg-red-300 transition-colors"
            >
              <Trash2 size={18} />
              전체 지우기
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />


          <div className="ml-auto">
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-md"
            >
              <Check size={18} />
              완성
            </button>
          </div>
        </div>
      </div>

      {/* 메인 작업 영역 */}
      <div className="flex-1 flex">
        {/* 캔버스 영역 */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-lg border border-orange-200 overflow-hidden h-full">
            <div
              ref={containerRef}
              className="w-full h-full"
              style={{
                cursor: tool === "wall" ? "crosshair" : "default"
              }}
            >
              <canvas
                ref={canvasRef}
                width={600}
                height={300}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="block"
                style={{
                  width: "100%",
                  height: "100%"
                }}
              />
            </div>
          </div>

          {/* 격자 정보 */}
          {/* <div className="mt-4 text-sm text-orange-600">
            <p>격자 크기: 500mm × 500mm</p>
            <p>
              총 벽 개수: {walls.length}개
            </p>
          </div> */}
        </div>

        {/* 사이드 패널 */}
        <div className="w-80 bg-orange-100 border-l border-orange-200 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">
            도구 정보
          </h3>

          {tool === "wall" && (
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-700 mb-2">
                벽 그리기 모드
              </h4>
              <p className="text-sm text-orange-600 mb-3">
                클릭하고 드래그하여 벽을 그립니다. 격자에 자동으로 맞춰집니다.
              </p>
              <p className="text-xs text-orange-500">
                각 벽에 자동으로 길이가 표시됩니다.
              </p>
            </div>
          )}

          {tool === "select" && (
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-700 mb-2">선택 모드</h4>
              <p className="text-sm text-orange-600 mb-3">
                벽을 클릭하여 선택하고 편집할 수 있습니다.
              </p>
              {selectedWall && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <h5 className="font-medium text-green-700 mb-1">선택된 벽</h5>
                  <p className="text-sm text-green-600">
                    길이: {calculateDistance(selectedWall.start, selectedWall.end)}mm
                  </p>
                  <button
                    onClick={() => {
                      setWalls((prev) => prev.filter((wall) => wall.id !== selectedWall.id));
                      setSelectedWall(null);
                    }}
                    className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}

          {tool === "eraser" && (
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-700 mb-2">지우기 모드</h4>
              <p className="text-sm text-orange-600">
                클릭하여 벽을 삭제할 수 있습니다.
              </p>
            </div>
          )}

          {/* 벽 목록 */}
          {walls.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-orange-700 mb-3">
                그려진 벽 목록
              </h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {walls.map((wall, index) => (
                  <div
                    key={wall.id}
                    className="bg-white p-3 rounded border border-orange-200"
                  >
                    <p className="text-sm font-medium text-orange-700">
                      벽 {index + 1}
                    </p>
                    <p className="text-xs text-orange-600">
                      길이: {calculateDistance(wall.start, wall.end)}mm
                    </p>
                    <p className="text-xs text-orange-500">
                      ({Math.round(wall.start.x / 2.5)},{" "}
                      {Math.round(wall.start.y / 2.5)}) → (
                      {Math.round(wall.end.x / 2.5)}, {Math.round(wall.end.y / 2.5)}
                      )
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanEditor;
