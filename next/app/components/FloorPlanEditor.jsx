import React, { useRef, useEffect, useState, useCallback } from "react";
import { WallDetector } from "../wallDetection.js";
import { useRouter } from "next/navigation";

import {
  Square,
  MousePointer,
  Eraser,
  Check,
  Upload,
  Trash2,
  Scissors,
} from "lucide-react";

const FloorPlanEditor = () => {
  const router = useRouter();
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
  const [editingWallLength, setEditingWallLength] = useState("");

  // 축척 설정 관련 상태
  const [isScaleSet, setIsScaleSet] = useState(false); // 축척이 설정되었는지 확인
  const [scaleWall, setScaleWall] = useState(null);
  const [scaleRealLength, setScaleRealLength] = useState("");
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3);
  const [cachedBackgroundImage, setCachedBackgroundImage] = useState(null);

  // 부분 지우기 관련 상태
  const [partialEraserSelectedWall, setPartialEraserSelectedWall] =
    useState(null);
  const [isSelectingEraseArea, setIsSelectingEraseArea] = useState(false);
  const [eraseAreaStart, setEraseAreaStart] = useState(null);
  const [eraseAreaEnd, setEraseAreaEnd] = useState(null);

  const fileInputRef = useRef(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // 축척 설정 관련 상태 (이미지 업로드 후 벽 선택 방식으로 변경)
  const [showScalePopup, setShowScalePopup] = useState(false);
  const [scaleImage, setScaleImage] = useState(null);
  const [selectedScaleWall, setSelectedScaleWall] = useState(null);
  const [realLength, setRealLength] = useState("");
  const [hoveredScaleWall, setHoveredScaleWall] = useState(null); // 팝업에서 호버된 벽
  const [imageTransform, setImageTransform] = useState(null); // 이미지 변환 정보 저장
  // 고정 격자 설정: 500mm x 500mm
  const GRID_SIZE_MM = 500; // 500mm x 500mm 고정
  const GRID_SIZE_PX = 25; // 픽셀 크기는 25px (500mm = 25px, 즉 1px = 20mm)
  const [pixelToMmRatio, setPixelToMmRatio] = useState(20); // 초기값 20mm/px, 후에 조정 가능

  // 뷰포트 패닝 및 줌 상태
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [viewScale, setViewScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState(null);

  // 수평/수직 제한 및 자유로운 위치 스냅 함수
  const snapToOrthogonal = (startPoint, currentPoint) => {
    if (!startPoint) return currentPoint;

    const dx = Math.abs(currentPoint.x - startPoint.x);
    const dy = Math.abs(currentPoint.y - startPoint.y);

    // 더 긴 방향으로 제한 (수평 또는 수직)
    if (dx > dy) {
      // 수평선
      return {
        x: currentPoint.x,
        y: startPoint.y,
      };
    } else {
      // 수직선
      return {
        x: startPoint.x,
        y: currentPoint.y,
      };
    }
  };

  // 격자에 스냅하는 함수 (기존 함수 유지)
  const snapToGrid = (x, y) => {
    return {
      x: Math.round(x / GRID_SIZE_PX) * GRID_SIZE_PX,
      y: Math.round(y / GRID_SIZE_PX) * GRID_SIZE_PX,
    };
  };

  // 거리 계산 - 항상 mm 단위로 표시 (기본값 또는 설정된 축척 사용)
  const calculateDistance = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    // 항상 mm 단위로 표시 (기본 축척 또는 설정된 축척 사용)
    return {
      value: Math.round(pixelDistance * pixelToMmRatio),
      unit: "mm",
    };
  };

  // 축척 설정 함수
  const applyScale = () => {
    if (!scaleWall || !scaleRealLength) return;

    const pixelDistance = Math.sqrt(
      Math.pow(scaleWall.end.x - scaleWall.start.x, 2) +
        Math.pow(scaleWall.end.y - scaleWall.start.y, 2)
    );

    const realLengthMm = parseFloat(scaleRealLength);
    const newPixelToMmRatio = realLengthMm / pixelDistance;

    setPixelToMmRatio(newPixelToMmRatio);
    setIsScaleSet(true); // 축척 설정 완료 표시
    setScaleWall(null);
    setScaleRealLength("");
    setTool("wall"); // 벽 그리기 모드로 변경

    alert(
      `축척이 설정되었습니다! (1픽셀 = ${newPixelToMmRatio.toFixed(
        2
      )}mm)\n이제 벽을 그려보세요.`
    );
  };

  // 벽 길이 조정 함수 (축척 설정 후에만 동작)
  const adjustWallLength = (wallId, newLengthMm) => {
    if (!isScaleSet) return; // 축척 미설정 시 조정 불가

    setWalls((prevWalls) => {
      return prevWalls.map((wall) => {
        if (wall.id === wallId) {
          const currentLength = calculateDistance(wall.start, wall.end);
          if (currentLength.value === 0) return wall;

          // 현재 벡터 계산
          const dx = wall.end.x - wall.start.x;
          const dy = wall.end.y - wall.start.y;
          const currentPixelLength = Math.sqrt(dx * dx + dy * dy);

          // 새로운 픽셀 길이 계산 (동적 축척 사용)
          const newPixelLength = newLengthMm / pixelToMmRatio;
          const scale = newPixelLength / currentPixelLength;

          // 새로운 끝점 계산 (시작점 고정)
          const newEnd = {
            x: wall.start.x + dx * scale,
            y: wall.start.y + dy * scale,
          };

          // 격자에 스냅
          const snappedEnd = snapToGrid(newEnd.x, newEnd.y);

          return {
            ...wall,
            end: snappedEnd,
          };
        }
        return wall;
      });
    });
  };

  // 선분을 부분적으로 잘라내는 함수
  const partialEraseWall = (wallId, eraseStart, eraseEnd) => {
    setWalls((prevWalls) => {
      return prevWalls.reduce((newWalls, wall) => {
        if (wall.id !== wallId) {
          return [...newWalls, wall];
        }

        // 선분 위의 점을 선분의 매개변수 t로 변환 (0 <= t <= 1)
        const getParameterOnLine = (point, lineStart, lineEnd) => {
          const dx = lineEnd.x - lineStart.x;
          const dy = lineEnd.y - lineStart.y;
          const lineLengthSq = dx * dx + dy * dy;

          if (lineLengthSq === 0) return 0;

          const t =
            ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
            lineLengthSq;
          return Math.max(0, Math.min(1, t)); // 0과 1 사이로 제한
        };

        // 지울 영역의 시작과 끝 매개변수 계산
        const t1 = getParameterOnLine(eraseStart, wall.start, wall.end);
        const t2 = getParameterOnLine(eraseEnd, wall.start, wall.end);

        // t1이 t2보다 작도록 정렬
        const tStart = Math.min(t1, t2);
        const tEnd = Math.max(t1, t2);

        // 잘라낼 영역이 너무 작으면 무시
        if (tEnd - tStart < 0.05) {
          return [...newWalls, wall];
        }

        const resultWalls = [];

        // 첫 번째 부분 (시작점부터 지울 영역 시작까지)
        if (tStart > 0.05) {
          const newEnd = {
            x: wall.start.x + (wall.end.x - wall.start.x) * tStart,
            y: wall.start.y + (wall.end.y - wall.start.y) * tStart,
          };
          const snappedEnd = snapToGrid(newEnd.x, newEnd.y);

          resultWalls.push({
            id: Date.now() + Math.random(),
            start: wall.start,
            end: snappedEnd,
          });
        }

        // 두 번째 부분 (지울 영역 끝부터 끝점까지)
        if (tEnd < 0.95) {
          const newStart = {
            x: wall.start.x + (wall.end.x - wall.start.x) * tEnd,
            y: wall.start.y + (wall.end.y - wall.start.y) * tEnd,
          };
          const snappedStart = snapToGrid(newStart.x, newStart.y);

          resultWalls.push({
            id: Date.now() + Math.random() + 1,
            start: snappedStart,
            end: wall.end,
          });
        }

        return [...newWalls, ...resultWalls];
      }, []);
    });
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

  // 마우스 위치를 캔버스 좌표로 변환 (중앙 기준 좌표계, 뷰포트 변환 포함)
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const FIXED_WIDTH = 1200;
    const FIXED_HEIGHT = 800;
    
    // 캔버스 중앙을 원점(0,0)으로 하는 좌표계로 변환
    const canvasX = ((e.clientX - rect.left) - rect.width / 2) / viewScale - viewOffset.x;
    const canvasY = ((e.clientY - rect.top) - rect.height / 2) / viewScale - viewOffset.y;
    return { x: canvasX, y: canvasY };
  };

  // 텍스트 그리기 함수 (선 아래에 작게 표시)
  // 여기서 font-size (폰트크기) 설정
  const drawText = (ctx, text, x, y, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);

    // 텍스트가 거꾸로 보이지 않도록 각도 조정
    let adjustedAngle = angle;
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
      adjustedAngle = angle + Math.PI;
    }

    ctx.rotate(adjustedAngle);
    ctx.fillStyle = "#333333";
    ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // 텍스트 렌더링 품질 개선
    ctx.textRenderingOptimization = "optimizeQuality";
    ctx.imageSmoothingEnabled = true;

    // 선 아래쪽으로 오프셋 (5px 아래)
    ctx.fillText(text, 0, 5);
    ctx.restore();
  };

  // 캔버스 그리기 : 선분 두께 등 수정
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");

    // 캔버스 크기 고정 (브라우저 줌과 무관하게 항상 동일)
    const FIXED_WIDTH = 1200;
    const FIXED_HEIGHT = 800;

    // 고해상도 렌더링 설정
    const dpr = window.devicePixelRatio || 1;

    // 캔버스 실제 해상도 설정 (고정 크기 기준)
    canvas.width = FIXED_WIDTH * dpr;
    canvas.height = FIXED_HEIGHT * dpr;

    // CSS 크기를 고정값으로 설정 (브라우저 줌 영향 없음)
    canvas.style.width = FIXED_WIDTH + "px";
    canvas.style.height = FIXED_HEIGHT + "px";

    // 컨텍스트 스케일 조정
    ctx.scale(dpr, dpr);

    // 전체 캔버스 클리어
    ctx.clearRect(0, 0, FIXED_WIDTH, FIXED_HEIGHT);

    // 고정된 캔버스 크기 사용
    const rect = {
      width: FIXED_WIDTH,
      height: FIXED_HEIGHT,
    };

    // 배경 이미지 그리기 (업로드된 이미지가 있는 경우)
    if (
      uploadedImage &&
      cachedBackgroundImage &&
      cachedBackgroundImage.complete
    ) {
      // 캔버스 중앙 기준으로 변환한 후 배경 이미지 그리기
      ctx.save();
      ctx.translate(rect.width / 2, rect.height / 2);
      ctx.scale(viewScale, viewScale);
      ctx.translate(viewOffset.x, viewOffset.y);

      // 캐시된 이미지 사용 (완전히 로드된 경우에만)
      const img = cachedBackgroundImage;

      // 이미지를 캔버스 크기에 맞춰 스케일링하여 그리기
      const imgAspect = img.width / img.height;
      const canvasAspect = rect.width / rect.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imgAspect > canvasAspect) {
        // 이미지가 캔버스보다 가로로 긴 경우
        drawWidth = rect.width;
        drawHeight = rect.width / imgAspect;
        drawX = -drawWidth / 2;
        drawY = -drawHeight / 2;
      } else {
        // 이미지가 캔버스보다 세로로 긴 경우
        drawHeight = rect.height;
        drawWidth = rect.height * imgAspect;
        drawX = -drawWidth / 2;
        drawY = -drawHeight / 2;
      }

      // 투명도 설정 (배경 이미지가 격자와 벽을 가리지 않도록)
      ctx.globalAlpha = backgroundOpacity;
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.globalAlpha = 1.0;

      // 뷰포트 변환 복원
      ctx.restore();

      // 격자와 벽 그리기
      drawGridAndWalls(ctx, rect);
    } else if (uploadedImage && !cachedBackgroundImage) {
      // 처음 로드하는 경우에만 새 이미지 객체 생성
      const img = new Image();
      img.onload = () => {
        // 이미지를 캐시에 저장
        setCachedBackgroundImage(img);

        // 캔버스 중앙 기준으로 변환한 후 배경 이미지 그리기
        ctx.save();
        ctx.translate(rect.width / 2, rect.height / 2);
        ctx.scale(viewScale, viewScale);
        ctx.translate(viewOffset.x, viewOffset.y);

        // 이미지를 캔버스 크기에 맞춰 스케일링하여 그리기
        const imgAspect = img.width / img.height;
        const canvasAspect = rect.width / rect.height;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > canvasAspect) {
          // 이미지가 캔버스보다 가로로 긴 경우
          drawWidth = rect.width;
          drawHeight = rect.width / imgAspect;
          drawX = -drawWidth / 2;
          drawY = -drawHeight / 2;
        } else {
          // 이미지가 캔버스보다 세로로 긴 경우
          drawHeight = rect.height;
          drawWidth = rect.height * imgAspect;
          drawX = -drawWidth / 2;
          drawY = -drawHeight / 2;
        }

        // 투명도 설정 (배경 이미지가 격자와 벽을 가리지 않도록)
        ctx.globalAlpha = backgroundOpacity;
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0;

        // 뷰포트 변환 복원
        ctx.restore();

        // 이미지 그리기 완료 후 격자와 벽 다시 그리기
        drawGridAndWalls(ctx, rect);

        // 이미지 로드 완료 후 추가 렌더링은 제거 (깜빡임 방지)
      };
      img.src = uploadedImage;
    } else {
      // 배경 이미지가 없는 경우 바로 격자와 벽 그리기
      drawGridAndWalls(ctx, rect);
    }
  };

  // 격자와 벽 그리기 함수 분리
  const drawGridAndWalls = (ctx, rect) => {
    // 캔버스 중앙을 원점으로 변환
    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);
    
    // 뷰포트 변환 적용
    ctx.scale(viewScale, viewScale);
    ctx.translate(viewOffset.x, viewOffset.y);

    // 텍스트 렌더링 품질 개선
    ctx.textRenderingOptimization = "optimizeQuality";
    ctx.imageSmoothingEnabled = false; // 격자는 선명하게

    // 고정 격자 크기 사용 (500mm x 500mm = 25px x 25px)
    const gridSize = GRID_SIZE_PX;

    // 뷰포트 영역 계산 (중앙 기준 좌표계에서 격자 범위 결정)
    const centerX = -viewOffset.x;
    const centerY = -viewOffset.y;
    const viewWidth = rect.width / (2 * viewScale);
    const viewHeight = rect.height / (2 * viewScale);
    
    const startX = Math.floor((centerX - viewWidth) / gridSize) * gridSize;
    const endX = Math.ceil((centerX + viewWidth) / gridSize) * gridSize;
    const startY = Math.floor((centerY - viewHeight) / gridSize) * gridSize;
    const endY = Math.ceil((centerY + viewHeight) / gridSize) * gridSize;

    // 격자 그리기 - 픽셀 정렬로 선명하게
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5 / viewScale; // 줌에 따라 선 두께 조정

    // 세로선
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // 가로선
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // 축척 설정용 벽 그리기 (임시)
    if (scaleWall && tool === "scale") {
      ctx.strokeStyle = "#9900ff"; // 축척 설정용 벽은 보라색
      ctx.lineWidth = 4 / viewScale;
      ctx.setLineDash([5 / viewScale, 5 / viewScale]);

      ctx.beginPath();
      ctx.moveTo(scaleWall.start.x, scaleWall.start.y);
      ctx.lineTo(scaleWall.end.x, scaleWall.end.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 축척 설정용 벽의 길이 표시
      const midX = (scaleWall.start.x + scaleWall.end.x) / 2;
      const midY = (scaleWall.start.y + scaleWall.end.y) / 2;
      const pixelDistance = Math.sqrt(
        Math.pow(scaleWall.end.x - scaleWall.start.x, 2) +
          Math.pow(scaleWall.end.y - scaleWall.start.y, 2)
      );
      const angle = Math.atan2(
        scaleWall.end.y - scaleWall.start.y,
        scaleWall.end.x - scaleWall.start.x
      );

      ctx.save();
      ctx.translate(midX, midY);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        ctx.rotate(angle + Math.PI);
      } else {
        ctx.rotate(angle);
      }
      ctx.fillStyle = "#9900ff";
      ctx.font = `bold ${12 / viewScale}px 'Segoe UI', Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${Math.round(pixelDistance)}px`, 0, 3 / viewScale);
      ctx.restore();
    }

    // 완성된 벽들 그리기
    walls.forEach((wall) => {
      // 선택된 벽인지 확인
      const isSelected = selectedWall?.id === wall.id;
      const isPartialEraserSelected = partialEraserSelectedWall?.id === wall.id;
      const isScaleSelected = selectedScaleWall?.id === wall.id;
      const isScaleHovered = hoveredScaleWall?.id === wall.id;

      // 벽 그리기 (선택된 벽은 다른 색상)
      if (isScaleSelected) {
        ctx.strokeStyle = "#0066ff"; // 축척 설정용 선택된 벽은 파란색
        ctx.lineWidth = 5 / viewScale;
      } else if (isScaleHovered) {
        ctx.strokeStyle = "#00aa00"; // 호버된 벽은 초록색
        ctx.lineWidth = 4 / viewScale;
      } else if (isPartialEraserSelected) {
        ctx.strokeStyle = "#ff0000"; // 부분 지우기 선택된 벽은 빨간색
        ctx.lineWidth = 3 / viewScale;
      } else if (isSelected) {
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 4 / viewScale;
      } else {
        ctx.strokeStyle = "#ff6600";
        ctx.lineWidth = 2 / viewScale;
      }

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

      // 텍스트 크기도 줌에 따라 조정
      ctx.save();
      ctx.translate(midX, midY);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        ctx.rotate(angle + Math.PI);
      } else {
        ctx.rotate(angle);
      }
      ctx.fillStyle = "#333333";
      ctx.font = `bold ${12 / viewScale}px 'Segoe UI', Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${distance.value}${distance.unit}`, 0, 3 / viewScale);
      ctx.restore();
    });

    // 부분 지우기 영역 표시
    if (isSelectingEraseArea && eraseAreaStart && eraseAreaEnd) {
      ctx.strokeStyle = "#0004ffff";
      ctx.lineWidth = 4 / viewScale;
      ctx.setLineDash([5 / viewScale, 5 / viewScale]);
      ctx.globalAlpha = 0.7;

      ctx.beginPath();
      ctx.moveTo(eraseAreaStart.x, eraseAreaStart.y);
      ctx.lineTo(eraseAreaEnd.x, eraseAreaEnd.y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    }

    // 현재 그리고 있는 벽 그리기
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = "#ff9933";
      ctx.lineWidth = 3 / viewScale;
      ctx.setLineDash([3 / viewScale, 3 / viewScale]);

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

      // 임시 벽의 치수 표시
      ctx.save();
      ctx.translate(midX, midY);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        ctx.rotate(angle + Math.PI);
      } else {
        ctx.rotate(angle);
      }
      ctx.fillStyle = "#ff9933";
      ctx.font = `bold ${12 / viewScale}px 'Segoe UI', Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${distance.value}${distance.unit}`, 0, 3 / viewScale);
      ctx.restore();
    }

    // 뷰포트 변환 복원
    ctx.restore();
  };

  // 패닝을 위한 마우스 이벤트 핸들러들
  const handlePanStart = (e) => {
    if (e.ctrlKey || e.button === 1) {
      // Ctrl + 클릭 또는 마우스 휠 클릭으로 패닝
      setIsDragging(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      return true;
    }
    return false;
  };

  const handlePanMove = (e) => {
    if (isDragging && lastPanPoint) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;

      setViewOffset((prev) => ({
        x: prev.x + deltaX / viewScale,
        y: prev.y + deltaY / viewScale,
      }));

      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handlePanEnd = () => {
    setIsDragging(false);
    setLastPanPoint(null);
  };

  // 줌 핸들러 (수정)
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, viewScale * delta));

    if (newScale !== viewScale) {
      // 마우스 위치를 캔버스 좌표계로 변환
      const worldMouseX = mouseX / viewScale - viewOffset.x;
      const worldMouseY = mouseY / viewScale - viewOffset.y;

      // 새로운 오프셋 계산 (마우스 위치가 고정되도록)
      const newOffsetX = mouseX / newScale - worldMouseX;
      const newOffsetY = mouseY / newScale - worldMouseY;

      setViewOffset({ x: newOffsetX, y: newOffsetY });
      setViewScale(newScale);
    }
  };

  // 마우스 이벤트 핸들러들
  const handleMouseDown = (e) => {
    // 패닝 모드 체크
    if (handlePanStart(e)) {
      return;
    }

    const coords = getCanvasCoordinates(e);

    if (tool === "wall" || tool === "scale") {
      setStartPoint(coords);
      setCurrentPoint(coords);
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
        const newSelectedWall =
          selectedWall?.id === closestWall.id ? null : closestWall;
        setSelectedWall(newSelectedWall);
        if (newSelectedWall) {
          setEditingWallLength(
            calculateDistance(
              newSelectedWall.start,
              newSelectedWall.end
            ).toString()
          );
        } else {
          setEditingWallLength("");
        }
      } else {
        setSelectedWall(null);
        setEditingWallLength("");
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
    } else if (tool === "partial_eraser") {
      if (!partialEraserSelectedWall) {
        // 1단계: 벽 선택
        let closestWall = null;
        let closestDistance = Infinity;
        const MAX_SELECT_DISTANCE = 30;

        walls.forEach((wall) => {
          const distance = getDistanceToWall(coords, wall);
          if (distance < closestDistance && distance < MAX_SELECT_DISTANCE) {
            closestDistance = distance;
            closestWall = wall;
          }
        });

        if (closestWall) {
          setPartialEraserSelectedWall(closestWall);
        }
      } else {
        // 2단계: 지울 영역 선택 시작
        setIsSelectingEraseArea(true);
        setEraseAreaStart(coords);
        setEraseAreaEnd(coords);
      }
    }
  };

  const handleMouseMove = (e) => {
    // 패닝 처리
    handlePanMove(e);

    if (isDrawing && (tool === "wall" || tool === "scale")) {
      const coords = getCanvasCoordinates(e);
      const orthogonal = snapToOrthogonal(startPoint, coords);
      setCurrentPoint(orthogonal);
    } else if (isSelectingEraseArea && tool === "partial_eraser") {
      const coords = getCanvasCoordinates(e);
      setEraseAreaEnd(coords);
    }
  };

  const handleMouseUp = (e) => {
    // 패닝 종료
    handlePanEnd();

    if (isDrawing && (tool === "wall" || tool === "scale") && startPoint) {
      const coords = getCanvasCoordinates(e);
      const orthogonal = snapToOrthogonal(startPoint, coords);

      // 시작점과 끝점이 다를 때만 벽 추가
      if (startPoint.x !== orthogonal.x || startPoint.y !== orthogonal.y) {
        const newWall = {
          id: Date.now(),
          start: startPoint,
          end: orthogonal,
        };

        // 축척 설정 모드인 경우
        if (tool === "scale") {
          setScaleWall(newWall);
        } else {
          setWalls((prev) => [...prev, newWall]);
        }
      }

      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    } else if (
      isSelectingEraseArea &&
      tool === "partial_eraser" &&
      partialEraserSelectedWall
    ) {
      // 부분 지우기 실행
      if (eraseAreaStart && eraseAreaEnd) {
        partialEraseWall(
          partialEraserSelectedWall.id,
          eraseAreaStart,
          eraseAreaEnd
        );
      }

      // 상태 초기화
      setIsSelectingEraseArea(false);
      setPartialEraserSelectedWall(null);
      setEraseAreaStart(null);
      setEraseAreaEnd(null);
    }
  };

  // []안의 값이 달라졌다면, 캔버스 다시 그리기
  useEffect(() => {
    drawCanvas();
  }, [
    walls,
    isDrawing,
    startPoint,
    currentPoint,
    selectedWall,
    uploadedImage,
    backgroundOpacity,
    cachedBackgroundImage,
    partialEraserSelectedWall,
    isSelectingEraseArea,
    eraseAreaStart,
    eraseAreaEnd,
    viewScale,
    viewOffset,
    // 축척 설정 관련 상태들
    isScaleSet,
    scaleWall,
  ]);

  // 초기 캔버스 설정
  useEffect(() => {
    // 컴포넌트 마운트 후 캔버스 초기화
    const initCanvas = () => {
      drawCanvas();
    };

    // 다음 프레임에서 실행하여 DOM이 완전히 렌더링된 후 처리
    const timeoutId = setTimeout(initCanvas, 0);

    return () => clearTimeout(timeoutId);
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 디바운스된 캔버스 리렌더링 함수
  const debouncedRedraw = useCallback(() => {
    // 캐시를 건드리지 않고 단순히 캔버스만 다시 그리기
    drawCanvas();
  }, [
    walls,
    uploadedImage,
    backgroundOpacity,
    cachedBackgroundImage,
    viewScale,
    viewOffset,
  ]);

  // 윈도우 리사이즈 및 컨테이너 크기 변화 감지
  useEffect(() => {
    let resizeTimeout;
    let resizeObserverTimeout;

    const handleResize = () => {
      // 이전 타이머 취소
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      // 즉시 캔버스 다시 그리기 (디바운스 없이)
      debouncedRedraw();

      // 추가적인 디바운스된 렌더링 (안정성을 위해)
      resizeTimeout = setTimeout(() => {
        debouncedRedraw();
      }, 50);
    };

    // 윈도우 리사이즈 이벤트
    window.addEventListener("resize", handleResize);

    // ResizeObserver로 컨테이너 크기 변화 직접 감지
    let resizeObserver;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        // 이전 타이머 취소
        if (resizeObserverTimeout) {
          clearTimeout(resizeObserverTimeout);
        }

        // 즉시 캔버스 다시 그리기 (크기 변경 즉시 반응)
        debouncedRedraw();

        // 추가적인 디바운스된 렌더링 (연속적인 크기 변경에 대비)
        resizeObserverTimeout = setTimeout(() => {
          debouncedRedraw();
        }, 20);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (resizeObserverTimeout) {
        clearTimeout(resizeObserverTimeout);
      }
    };
  }, [debouncedRedraw]); // debouncedRedraw 의존성 추가

  // 이미지 업로드 처리
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setIsProcessing(true);

    try {
      // WallDetector로 벽 검출
      const detector = new WallDetector();
      const result = await detector.detectWalls(file, {
        morphType: 0, // OPEN 연산으로 노이즈 제거
        canny1: 50, // 낮은 임계값
        canny2: 100, // 높은 임계값
        houghTh: 60, // Hough 변환 임계값 낮춤
        minLen: 25, // 최소 선분 길이
        maxGap: 15, // 선분 간 최대 간격
      });

      // 이미지 크기를 캔버스 크기에 맞춰 스케일 계산
      const canvas = canvasRef.current;
      const containerRect = canvas.getBoundingClientRect();

      // 이미지 비율과 캔버스 비율 계산
      const imgAspect = result.imageWidth / result.imageHeight;
      const canvasAspect = containerRect.width / containerRect.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawWidth = containerRect.width;
        drawHeight = containerRect.width / imgAspect;
        drawX = -drawWidth / 2;
        drawY = -drawHeight / 2;
      } else {
        drawHeight = containerRect.height;
        drawWidth = containerRect.height * imgAspect;
        drawX = -drawWidth / 2;
        drawY = -drawHeight / 2;
      }

      // 검출된 좌표를 중앙 기준 캔버스 좌표로 변환
      const scaleX = drawWidth / result.imageWidth;
      const scaleY = drawHeight / result.imageHeight;

      // 검출된 선분들을 벽으로 변환 (중앙 기준 좌표계로)
      const detectedWalls = result.lines.map((line, index) => {
        const canvasStartX = line.x1 * scaleX + drawX;
        const canvasStartY = line.y1 * scaleY + drawY;
        const canvasEndX = line.x2 * scaleX + drawX;
        const canvasEndY = line.y2 * scaleY + drawY;

        return {
          id: Date.now() + index,
          start: { x: canvasStartX, y: canvasStartY },
          end: { x: canvasEndX, y: canvasEndY },
        };
      });

      setWalls(detectedWalls);
      setUploadedImage(imageUrl);
      setScaleImage({ file, url: imageUrl });

      // 이미지 변환 정보 저장 (팝업에서 정확한 좌표 변환을 위해)
      setImageTransform({
        imageWidth: result.imageWidth,
        imageHeight: result.imageHeight,
        drawWidth,
        drawHeight,
        drawX,
        drawY,
        scaleX,
        scaleY,
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
      });

      alert(
        `벽 검출이 완료되었습니다! (${detectedWalls.length}개 검출) '축척 설정' 버튼을 클릭해서 축척을 설정하세요.`
      );
    } catch (error) {
      console.error("Wall detection failed:", error);
      alert("벽 검출에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 전체 벽 지우기 함수
  const clearAllWalls = () => {
    if (walls.length === 0) {
      alert("지울 벽이 없습니다.");
      return;
    }

    if (window.confirm(`모든 벽을 삭제하시겠습니까? (총 ${walls.length}개)`)) {
      setWalls([]);
      setSelectedWall(null);
      alert("모든 벽이 삭제되었습니다.");
    }
  };

  // PNG 다운로드 함수
  const downloadAsPNG = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `floor-plan-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // 완성 버튼 핸들러
  const handleComplete = () => {
    downloadAsPNG();
    alert(
      `도면이 완성되어 PNG 파일로 저장되었습니다! 총 ${walls.length}개의 벽이 그려졌습니다.`
    );
  };

  // 시뮬레이터로 이동 핸들러
  const handleGoToSimulator = async () => {
    if (walls.length === 0) {
      alert("먼저 도면을 그려주세요.");
      return;
    }

    setIsCreatingRoom(true);

    try {
      // 도면 데이터 준비 (API 스키마에 맞춤)
      const roomData = {
        title: `Floor Plan Room ${new Date().toLocaleString()}`,
        description: `Generated from floor plan with ${walls.length} walls`,
        is_public: false,
        room_data: {
          walls: walls,
          pixelToMmRatio: pixelToMmRatio, // 동적 축척 사용
        },
      };

      // 서버에 룸 생성 요청
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Room creation failed:", response.status, errorData);
        throw new Error(`룸 생성에 실패했습니다. (${response.status})`);
      }

      const createdRoom = await response.json();

      // API 응답 구조 확인을 위한 디버깅
      console.log("Created room response:", createdRoom);

      // 응답 성공 여부 확인
      if (!createdRoom.success) {
        console.error("Room creation was not successful:", createdRoom);
        throw new Error("룸 생성이 실패했습니다.");
      }

      // API 응답에서 room_id 필드 사용
      const roomId = createdRoom.room_id;

      if (!roomId) {
        console.error("No valid room ID found in response:", createdRoom);
        throw new Error("생성된 방의 ID를 찾을 수 없습니다.");
      }

      // UUID 형식 검증 (기본적인 체크)
      if (typeof roomId !== "string" || roomId.length < 10) {
        console.error("Invalid room ID format:", roomId);
        throw new Error("올바르지 않은 방 ID입니다.");
      }

      console.log("Using room ID for navigation:", roomId);

      // 생성된 정식 room_id로 시뮬레이터 페이지 이동
      router.push(`/sim/${roomId}`);

      alert(
        `${walls.length}개의 벽으로 구성된 방이 생성되었습니다! 시뮬레이터에서 꾸며보세요.`
      );
    } catch (error) {
      console.error("Room creation failed:", error);
      alert("방 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className="w-full h-screen bg-orange-50 flex flex-col overflow-hidden">
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
              onClick={() => {
                setTool("partial_eraser");
                setPartialEraserSelectedWall(null);
                setIsSelectingEraseArea(false);
                setEraseAreaStart(null);
                setEraseAreaEnd(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                tool === "partial_eraser"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-orange-200 text-orange-700 hover:bg-orange-300"
              }`}
            >
              <Scissors size={18} />
              부분 지우기
            </button>

            <button
              onClick={() => {
                setTool("scale");
                setScaleWall(null);
                setScaleRealLength("");
              }}
              disabled={!uploadedImage}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                !uploadedImage
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : tool === "scale"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-orange-200 text-orange-700 hover:bg-orange-300"
              }`}
            >
              <Square size={18} />
              축척 설정
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-300 transition-colors disabled:opacity-50"
            >
              <Upload size={18} />
              {isProcessing ? "처리중..." : "도면 업로드"}
            </button>

            <button
              onClick={clearAllWalls}
              className="flex items-center gap-2 px-4 py-2 bg-red-200 text-red-700 rounded-lg font-medium hover:bg-red-300 transition-colors"
            >
              <Trash2 size={18} />
              전체 지우기
            </button>

            {uploadedImage && (
              <button
                onClick={() => {
                  setUploadedImage(null);
                  setCachedBackgroundImage(null);
                  alert("배경 이미지가 제거되었습니다.");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                <Trash2 size={18} />
                배경 제거
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleGoToSimulator}
              disabled={walls.length === 0 || isCreatingRoom}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              {isCreatingRoom ? "방 생성 중..." : "집 생성하기"}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 작업 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 캔버스 영역 */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="bg-white rounded-lg shadow-lg border border-orange-200 overflow-hidden h-full">
            <div ref={containerRef} className="w-full h-full relative">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
                className="block"
                style={{
                  width: "100%",
                  height: "100%",
                  cursor: tool === "wall" ? "crosshair" : "default",
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
        <div className="w-80 bg-orange-100 border-l border-orange-200 p-6 overflow-y-auto flex-shrink-0">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">
            도구 정보
          </h3>

          {/* 축척 설정 도구 */}
          {tool === "scale" && (
            <div className="bg-white p-4 rounded-lg border border-orange-200 mb-4">
              <h4 className="font-medium text-orange-700 mb-2">
                축척 설정 도구
              </h4>
              {!scaleWall ? (
                <p className="text-sm text-orange-600 mb-3">
                  기준이 될 벽을 그려주세요. (보라색 점선으로 표시됩니다)
                </p>
              ) : (
                <div>
                  <p className="text-sm text-orange-600 mb-2">
                    그린 벽:{" "}
                    {Math.round(
                      Math.sqrt(
                        Math.pow(scaleWall.end.x - scaleWall.start.x, 2) +
                          Math.pow(scaleWall.end.y - scaleWall.start.y, 2)
                      )
                    )}
                    픽셀
                  </p>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-orange-700 mb-1">
                      실제 길이 (mm):
                    </label>
                    <input
                      type="number"
                      value={scaleRealLength}
                      onChange={(e) => setScaleRealLength(e.target.value)}
                      placeholder="예: 3000"
                      className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={applyScale}
                      disabled={!scaleRealLength}
                      className="flex-1 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                      축척 적용
                    </button>
                    <button
                      onClick={() => {
                        setScaleWall(null);
                        setScaleRealLength("");
                        setTool("wall");
                      }}
                      className="flex-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
                  <h5 className="font-medium text-green-700 mb-2">선택된 벽</h5>
                  <p className="text-sm text-green-600 mb-2">
                    현재 길이:{" "}
                    {(() => {
                      const dist = calculateDistance(
                        selectedWall.start,
                        selectedWall.end
                      );
                      return `${dist.value}${dist.unit}`;
                    })()}
                  </p>

                  {isScaleSet && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        길이 조정 (mm):
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={editingWallLength}
                          onChange={(e) => setEditingWallLength(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="길이 입력"
                        />
                        <button
                          onClick={() => {
                            const newLength = parseFloat(editingWallLength);
                            if (newLength && newLength > 0) {
                              adjustWallLength(selectedWall.id, newLength);
                            }
                          }}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          적용
                        </button>
                      </div>
                    </div>
                  )}

                  {!isScaleSet && (
                    <div className="mb-3">
                      <p className="text-xs text-orange-600">
                        정확한 길이 조정을 위해 '축척 설정'을 먼저 하세요.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setWalls((prev) =>
                        prev.filter((wall) => wall.id !== selectedWall.id)
                      );
                      setSelectedWall(null);
                      setEditingWallLength("");
                    }}
                    className="w-full px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
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

          {tool === "partial_eraser" && (
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-700 mb-2">
                부분 지우기 모드
              </h4>
              {!partialEraserSelectedWall ? (
                <p className="text-sm text-orange-600">
                  1단계: 자를 벽을 클릭하여 선택하세요. (빨간색으로 표시됩니다)
                </p>
              ) : (
                <div>
                  <p className="text-sm text-orange-600 mb-2">
                    2단계: 지울 영역을 드래그하여 선택하세요.
                  </p>
                  <button
                    onClick={() => {
                      setPartialEraserSelectedWall(null);
                      setIsSelectingEraseArea(false);
                      setEraseAreaStart(null);
                      setEraseAreaEnd(null);
                    }}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    선택 취소
                  </button>
                </div>
              )}
            </div>
          )}
          {/* 뷰포트 컨트롤 */}
          <div className="bg-white p-4 rounded-lg border border-orange-200 mb-4">
            <h4 className="font-medium text-orange-700 mb-3">뷰포트 컨트롤</h4>

            <div className="mb-3">
              <label className="block text-sm text-orange-600 mb-1">
                줌: {Math.round(viewScale * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={viewScale}
                onChange={(e) => {
                  const newScale = parseFloat(e.target.value);
                  setViewScale(newScale);
                }}
                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setViewScale((prev) => Math.min(10, prev * 1.2))}
                className="flex-1 px-2 py-1 bg-orange-200 text-orange-700 text-sm rounded hover:bg-orange-300"
              >
                확대
              </button>
              <button
                onClick={() =>
                  setViewScale((prev) => Math.max(0.1, prev / 1.2))
                }
                className="flex-1 px-2 py-1 bg-orange-200 text-orange-700 text-sm rounded hover:bg-orange-300"
              >
                축소
              </button>
            </div>

            <button
              onClick={() => {
                setViewScale(1);
                setViewOffset({ x: 0, y: 0 });
              }}
              className="w-full px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
            >
              초기 위치로
            </button>

            <p className="text-xs text-orange-500 mt-2">
              Ctrl+드래그: 패닝 | 휠: 줌
            </p>
          </div>

          {/* 배경 이미지 투명도 조정 */}
          {uploadedImage && (
            <div className="bg-white p-4 rounded-lg border border-orange-200 mb-4">
              <h4 className="font-medium text-orange-700 mb-2">
                배경 이미지 설정
              </h4>
              <div className="mb-2">
                <label className="block text-sm text-orange-600 mb-1">
                  투명도: {Math.round(backgroundOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={backgroundOpacity}
                  onChange={(e) =>
                    setBackgroundOpacity(parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <button
                onClick={() => {
                  setUploadedImage(null);
                  setCachedBackgroundImage(null);
                  alert("배경 이미지가 제거되었습니다.");
                }}
                className="w-full px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                배경 이미지 제거
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanEditor;
