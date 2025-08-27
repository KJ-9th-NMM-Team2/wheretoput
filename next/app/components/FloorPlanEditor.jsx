import React, { useRef, useEffect, useState, useCallback } from 'react';

import {
  Square,
  MousePointer,
  Eraser,
  Check,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const FloorPlanEditor = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState("wall");
  const [walls, setWalls] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState(null);

  const GRID_SIZE = 50; // 500mm를 50px로 표현 (1px = 10mm)
  const CANVAS_WIDTH = 2000; // 더 큰 캔버스 (20m x 15m)
  const CANVAS_HEIGHT = 1500;

  // 격자에 스냅하는 함수
  const snapToGrid = (x, y) => {
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  };

  // 거리 계산 (mm 단위)
  const calculateDistance = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.round(distance * 10); // px를 mm로 변환 (1px = 10mm)
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.clientX - rect.left) * scaleX - pan.x) / zoom;
    const y = ((e.clientY - rect.top) * scaleY - pan.y) / zoom;
    return { x, y };
  };

  // 텍스트 그리기 함수
  const drawText = (ctx, text, x, y, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#ff6600";
    ctx.font = `${16 / zoom}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  // 캔버스 그리기
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 전체 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 변환 적용
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x / zoom, pan.y / zoom);

    // 격자 그리기
    ctx.strokeStyle = "#ffcc99";
    ctx.lineWidth = 1 / zoom;

    // 세로선
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // 가로선
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // 완성된 벽들 그리기
    ctx.strokeStyle = "#ff6600";
    ctx.lineWidth = 3 / zoom;

    walls.forEach((wall) => {
      // 벽 그리기
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();

      // 길이 표시
      const midX = (wall.start.x + wall.end.x) / 2;
      const midY = (wall.start.y + wall.end.y) / 2;
      const distance = calculateDistance(wall.start, wall.end);
      const angle = Math.atan2(
        wall.end.y - wall.start.y,
        wall.end.x - wall.start.x
      );

      // 배경 박스
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.strokeStyle = "#ff6600";
      ctx.lineWidth = 1 / zoom;

      const textWidth = ctx.measureText(`${distance}mm`).width + 16;
      const textHeight = 24;

      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.fillRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight);
      ctx.strokeRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight);
      ctx.restore();

      drawText(ctx, `${distance}mm`, midX, midY, angle);
    });

    // 현재 그리고 있는 벽 그리기
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = "#ff9933";
      ctx.lineWidth = 3 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // 현재 그리고 있는 벽의 길이 표시
      const midX = (startPoint.x + currentPoint.x) / 2;
      const midY = (startPoint.y + currentPoint.y) / 2;
      const distance = calculateDistance(startPoint, currentPoint);
      const angle = Math.atan2(
        currentPoint.y - startPoint.y,
        currentPoint.x - startPoint.x
      );

      ctx.fillStyle = "rgba(255, 153, 51, 0.9)";
      ctx.strokeStyle = "#ff9933";
      ctx.lineWidth = 1 / zoom;

      const textWidth = ctx.measureText(`${distance}mm`).width + 16;
      const textHeight = 24;

      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.fillRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight);
      ctx.strokeRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight);
      ctx.restore();

      drawText(ctx, `${distance}mm`, midX, midY, angle);
    }

    ctx.restore();
  };

  // 마우스 이벤트 핸들러들
  const handleMouseDown = (e) => {
    const coords = getCanvasCoordinates(e);

    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // 중간 버튼 또는 Ctrl+클릭으로 팬
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === "wall") {
      const snapped = snapToGrid(coords.x, coords.y);
      setStartPoint(snapped);
      setCurrentPoint(snapped);
      setIsDrawing(true);
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
    if (isPanning && lastPanPoint) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDrawing && tool === "wall") {
      const coords = getCanvasCoordinates(e);
      const snapped = snapToGrid(coords.x, coords.y);
      setCurrentPoint(snapped);
    }
  };

  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPoint(null);
      return;
    }

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

  // 휠 이벤트로 줌
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta));

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan((prev) => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
    }));

    setZoom(newZoom);
  };

  // 캔버스 다시 그리기
  useEffect(() => {
    drawCanvas();
  }, [walls, isDrawing, startPoint, currentPoint, zoom, pan]);

  // 완성 버튼 핸들러
  const handleComplete = () => {
    alert(`도면이 완성되었습니다! 총 ${walls.length}개의 벽이 그려졌습니다.`);
  };

  // 줌 버튼 핸들러
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, prev * 1.2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.1, prev / 1.2));
  };

  return (
    <div className="w-full h-screen bg-orange-50 flex flex-col">
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
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleZoomOut}
              className="flex items-center gap-2 px-3 py-2 bg-orange-200 text-orange-700 rounded-lg hover:bg-orange-300 transition-colors"
            >
              <ZoomOut size={18} />
            </button>
            <span className="px-3 py-2 bg-orange-200 text-orange-700 rounded-lg font-medium min-w-[80px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="flex items-center gap-2 px-3 py-2 bg-orange-200 text-orange-700 rounded-lg hover:bg-orange-300 transition-colors"
            >
              <ZoomIn size={18} />
            </button>
          </div>

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
              className="w-full h-full overflow-auto"
              style={{
                cursor: isPanning
                  ? "grabbing"
                  : tool === "wall"
                  ? "crosshair"
                  : "default",
              }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                className="block"
                style={{
                  width: "100%",
                  height: "100%",
                  minWidth: "800px",
                  minHeight: "600px",
                }}
              />
            </div>
          </div>

          {/* 격자 정보 */}
          <div className="mt-4 text-sm text-orange-600">
            <p>격자 크기: 500mm × 500mm | 전체 영역: 20m × 15m</p>
            <p>
              총 벽 개수: {walls.length}개 | 줌: {Math.round(zoom * 100)}%
            </p>
            <p className="text-xs mt-1">
              💡 마우스 휠로 줌, Ctrl+클릭으로 이동
            </p>
          </div>
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
              <p className="text-sm text-orange-600">
                벽을 클릭하여 선택하고 편집할 수 있습니다.
              </p>
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
                      ({Math.round(wall.start.x / 5)},{" "}
                      {Math.round(wall.start.y / 5)}) → (
                      {Math.round(wall.end.x / 5)}, {Math.round(wall.end.y / 5)}
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
