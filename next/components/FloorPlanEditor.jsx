import React, { useRef, useEffect, useState, useCallback } from "react";
import { WallDetector } from "@/lib/wallDetection.js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CreateRoomModal from "@/components/CreateRoomModal";
import toast from "react-hot-toast";

import {
  Square,
  MousePointer,
  Eraser,
  Check,
  Upload,
  Trash2,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Brush,
  RotateCcw,
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState(null);

  // 축척 설정 관련 상태 (이미지 업로드 후 벽 선택 방식으로 변경)
  const [showScalePopup, setShowScalePopup] = useState(false);
  const [scaleImage, setScaleImage] = useState(null);
  const [selectedScaleWall, setSelectedScaleWall] = useState(null);
  const [realLength, setRealLength] = useState("");
  const [hoveredScaleWall, setHoveredScaleWall] = useState(null); // 팝업에서 호버된 벽
  const [hoveredEraserWall, setHoveredEraserWall] = useState(null); // 지우기 도구에서 호버된 벽
  const [hoveredSelectWall, setHoveredSelectWall] = useState(null); // 선택 도구에서 호버된 벽
  const [hoveredPartialEraserWall, setHoveredPartialEraserWall] =
    useState(null); // 부분지우기 도구에서 호버된 벽
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

    toast.success(
      `축척이 설정되었습니다! (1픽셀 = ${newPixelToMmRatio.toFixed(2)}mm)`
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
          // 격자 스냅 제거 - 정확한 좌표 유지로 각도 보존

          resultWalls.push({
            id: Date.now() + Math.random(),
            start: wall.start,
            end: newEnd,
          });
        }

        // 두 번째 부분 (지울 영역 끝부터 끝점까지)
        if (tEnd < 0.95) {
          const newStart = {
            x: wall.start.x + (wall.end.x - wall.start.x) * tEnd,
            y: wall.start.y + (wall.end.y - wall.start.y) * tEnd,
          };
          // 격자 스냅 제거 - 정확한 좌표 유지로 각도 보존

          resultWalls.push({
            id: Date.now() + Math.random() + 1,
            start: newStart,
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

  // 점을 선분 위에 투영시키는 함수 (부분 지우기에서 사용)
  const projectPointOntoWall = (point, wall) => {
    const A = point.x - wall.start.x;
    const B = point.y - wall.start.y;
    const C = wall.end.x - wall.start.x;
    const D = wall.end.y - wall.start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return { x: wall.start.x, y: wall.start.y };

    // 매개변수를 0과 1 사이로 제한하여 선분 위에만 투영
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    return {
      x: wall.start.x + param * C,
      y: wall.start.y + param * D,
    };
  };

  // 마우스 위치를 캔버스 좌표로 변환 (중앙 기준 좌표계, 뷰포트 변환 포함)
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // 캔버스 중앙을 원점(0,0)으로 하는 좌표계로 변환
    const canvasX =
      (e.clientX - rect.left - rect.width / 2) / viewScale - viewOffset.x;
    const canvasY =
      (e.clientY - rect.top - rect.height / 2) / viewScale - viewOffset.y;
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

    // 선 아래쪽으로 오프셋 (8px 아래)
    ctx.fillText(text, 0, 8);
    ctx.restore();
  };

  // 캔버스 그리기 : 선분 두께 등 수정
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");

    // 컨테이너 크기에 맞춰 동적으로 캔버스 크기 설정
    const canvasWidth = 1600;
    const canvasHeight = 1200;

    // 고해상도 렌더링 설정
    const dpr = window.devicePixelRatio || 1;

    // 캔버스 실제 해상도 설정 (고정 크기 기준)
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;

    // CSS 크기를 고정 크기로 설정
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";

    // 컨텍스트 스케일 조정
    ctx.scale(dpr, dpr);

    // 전체 캔버스 클리어
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 고정 캔버스 크기 사용
    const rect = {
      width: canvasWidth,
      height: canvasHeight,
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

      // 이미지를 고정 캔버스 크기에 맞춰 스케일링하여 그리기
      const imgAspect = img.width / img.height;
      const canvasAspect = rect.width / rect.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imgAspect > canvasAspect) {
        // 이미지가 캔버스보다 가로로 긴 경우
        drawWidth = rect.width * 0.8;
        drawHeight = drawWidth / imgAspect;
        drawX = -drawWidth / 2;
        drawY = -drawHeight / 2;
      } else {
        // 이미지가 캔버스보다 세로로 긴 경우
        drawHeight = rect.height * 0.8;
        drawWidth = drawHeight * imgAspect;
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

        // 이미지를 고정 캔버스 크기에 맞춰 스케일링하여 그리기
        const imgAspect = img.width / img.height;
        const canvasAspect = rect.width / rect.height;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > canvasAspect) {
          // 이미지가 캔버스보다 가로로 긴 경우
          drawWidth = rect.width * 0.8; // 캔버스 크기의 80%로 제한
          drawHeight = drawWidth / imgAspect;
          drawX = -drawWidth / 2;
          drawY = -drawHeight / 2;
        } else {
          // 이미지가 캔버스보다 세로로 긴 경우
          drawHeight = rect.height * 0.8; // 캔버스 크기의 80%로 제한
          drawWidth = drawHeight * imgAspect;
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

    // 충분히 큰 고정 범위로 격자를 그려서 전체 캔버스를 완전히 덮음
    const gridRange = 5000; // 5000px 범위 (-5000 ~ +5000)
    const startX = -gridRange;
    const endX = gridRange;
    const startY = -gridRange;
    const endY = gridRange;

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
      ctx.strokeStyle = "rgba(0, 102, 255, 0.7)"; // 파란색 반투명
      ctx.lineWidth = 10 / viewScale; // 드로잉 시와 같은 두께

      // 물감 느낌을 위한 부드러운 선 설정
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(scaleWall.start.x, scaleWall.start.y);
      ctx.lineTo(scaleWall.end.x, scaleWall.end.y);
      ctx.stroke();
      // 축척 설정용 벽의 px 표시 제거 (치수 텍스트 숨김)
    }

    // 완성된 벽들 그리기
    walls.forEach((wall) => {
      // 선택된 벽인지 확인
      const isSelected = selectedWall?.id === wall.id;
      const isPartialEraserSelected = partialEraserSelectedWall?.id === wall.id;
      const isScaleSelected = selectedScaleWall?.id === wall.id;
      const isScaleHovered = hoveredScaleWall?.id === wall.id;
      const isEraserHovered = hoveredEraserWall?.id === wall.id;
      const isSelectHovered = hoveredSelectWall?.id === wall.id;
      const isPartialEraserHovered = hoveredPartialEraserWall?.id === wall.id;

      // 벽 그리기 (선택된 벽은 다른 색상)
      if (isEraserHovered) {
        ctx.strokeStyle = "#0066ff"; // 지우기 호버색
        ctx.lineWidth = 10 / viewScale;
      } else if (isPartialEraserHovered) {
        ctx.strokeStyle = "#0066ff"; // 부분지우기 호버색
        ctx.lineWidth = 10 / viewScale;
      } else if (isSelectHovered) {
        ctx.strokeStyle = "#0066ff"; // 선택 도구 호버색
        ctx.lineWidth = 10 / viewScale;
      } else if (isScaleSelected) {
        ctx.strokeStyle = "#0066ff"; // 축척 설정용 선택된 벽은 파란색
        ctx.lineWidth = 5 / viewScale;
      } else if (isScaleHovered) {
        ctx.strokeStyle = "#0066ff"; // 축척 호버된 벽도 파란색
        ctx.lineWidth = 4 / viewScale;
      } else if (isPartialEraserSelected) {
        ctx.strokeStyle = "#ff0000"; // 부분 지우기 선택된 벽은 빨간색
        ctx.lineWidth = 8 / viewScale; // 기본 벽과 동일한 두께
      } else if (isSelected) {
        ctx.strokeStyle = "#0066ff"; // 선택된 벽도 파란색
        ctx.lineWidth = 8 / viewScale;
      } else {
        ctx.strokeStyle = "rgba(43, 43, 43, 0.8)"; // 반투명 효과
        ctx.lineWidth = 8 / viewScale; // 더 두꺼운 선
      }

      // 물감 느낌을 위한 부드러운 선 설정
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();

      // 길이 표시 (축척 설정 모드가 아닐 때만)
      if (tool !== "scale") {
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
        ctx.fillText(`${distance.value}${distance.unit}`, 0, 8 / viewScale);
        ctx.restore();
      }
    });

    // 부분 지우기 영역 표시
    if (isSelectingEraseArea && eraseAreaStart && eraseAreaEnd) {
      ctx.strokeStyle = "rgba(0, 68, 255, 0.7)"; // 파란색 반투명
      ctx.lineWidth = 10 / viewScale; // 드로잉 시와 같은 두께

      // 물감 느낌을 위한 부드러운 선 설정
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(eraseAreaStart.x, eraseAreaStart.y);
      ctx.lineTo(eraseAreaEnd.x, eraseAreaEnd.y);
      ctx.stroke();
    }

    // 현재 그리고 있는 벽 그리기
    if (isDrawing && startPoint && currentPoint) {
      if (tool === "scale") {
        ctx.strokeStyle = "rgba(0, 68, 255, 0.7)"; // 축척 도구일 때 파란색 반투명
      } else {
        ctx.strokeStyle = "rgba(43, 43, 43, 0.7)"; // 일반 벽 그리기일 때
      }
      ctx.lineWidth = 10 / viewScale; // 그리는 중일 때 더 두꺼운 선

      if (tool === "scale") {
        // 축척 도구일 때는 실선
      } else {
        // 일반 벽 그리기일 때는 점선
        ctx.setLineDash([3 / viewScale, 3 / viewScale]);
      }

      // 물감 느낌을 위한 부드러운 선 설정
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      if (tool !== "scale") {
        ctx.setLineDash([]);
      }

      // 현재 그리고 있는 벽의 길이 표시 (축척 설정 모드가 아닐 때만)
      if (tool !== "scale") {
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
        ctx.fillStyle = "#0066ff";
        ctx.font = `bold ${12 / viewScale}px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`${distance.value}${distance.unit}`, 0, 8 / viewScale);
        ctx.restore();
      }
    }

    // 뷰포트 변환 복원
    ctx.restore();
  };

  // 패닝을 위한 마우스 이벤트 핸들러들
  const handlePanStart = (e) => {
    // 왼쪽 클릭으로 패닝 (도구가 비활성화 상태일 때만)
    if (e.button === 0) {
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

  // 줌 핸들러 (캔버스 중앙 기준)
  const handleWheel = (e) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, viewScale * delta));

    if (newScale !== viewScale) {
      // 캔버스 중앙을 기준으로 줌 (현재 뷰의 중앙점 유지)
      const scaleRatio = newScale / viewScale;

      setViewOffset((prev) => ({
        x: prev.x * scaleRatio,
        y: prev.y * scaleRatio,
      }));
      setViewScale(newScale);
    }
  };

  // 마우스 이벤트 핸들러들
  const handleMouseDown = (e) => {
    // 도구가 "none"이거나 활성화된 도구가 없을 때 패닝 가능
    const shouldCheckPan =
      tool === "none" ||
      !tool ||
      (uploadedImage &&
        tool !== "wall" &&
        tool !== "scale" &&
        tool !== "select" &&
        tool !== "eraser" &&
        tool !== "partial_eraser");

    if (shouldCheckPan && handlePanStart(e)) {
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
        // 시작점도 선택된 선분 위로 제한
        const constrainedStart = projectPointOntoWall(
          coords,
          partialEraserSelectedWall
        );
        setIsSelectingEraseArea(true);
        setEraseAreaStart(constrainedStart);
        setEraseAreaEnd(constrainedStart);
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
    } else if (
      isSelectingEraseArea &&
      tool === "partial_eraser" &&
      partialEraserSelectedWall
    ) {
      const coords = getCanvasCoordinates(e);
      // 마우스 좌표를 선택된 선분 위로 제한
      const constrainedCoords = projectPointOntoWall(
        coords,
        partialEraserSelectedWall
      );
      setEraseAreaEnd(constrainedCoords);
    } else if (tool === "eraser") {
      // 지우기 도구일 때 호버된 벽 감지
      const coords = getCanvasCoordinates(e);
      let closestWall = null;
      let closestDistance = Infinity;
      const MAX_HOVER_DISTANCE = 20; // 20픽셀 이내의 벽만 호버 효과

      walls.forEach((wall) => {
        const distance = getDistanceToWall(coords, wall);
        if (distance < closestDistance && distance < MAX_HOVER_DISTANCE) {
          closestDistance = distance;
          closestWall = wall;
        }
      });

      setHoveredEraserWall(closestWall);
    } else if (tool === "select") {
      // 선택 도구일 때 호버된 벽 감지
      const coords = getCanvasCoordinates(e);
      let closestWall = null;
      let closestDistance = Infinity;
      const MAX_HOVER_DISTANCE = 30; // 30픽셀 이내의 벽만 호버 효과

      walls.forEach((wall) => {
        const distance = getDistanceToWall(coords, wall);
        if (distance < closestDistance && distance < MAX_HOVER_DISTANCE) {
          closestDistance = distance;
          closestWall = wall;
        }
      });

      setHoveredSelectWall(closestWall);
    } else if (tool === "partial_eraser" && !partialEraserSelectedWall) {
      // 부분지우기 도구일 때 (1단계: 벽 선택 전) 호버된 벽 감지
      const coords = getCanvasCoordinates(e);
      let closestWall = null;
      let closestDistance = Infinity;
      const MAX_HOVER_DISTANCE = 30; // 30픽셀 이내의 벽만 호버 효과

      walls.forEach((wall) => {
        const distance = getDistanceToWall(coords, wall);
        if (distance < closestDistance && distance < MAX_HOVER_DISTANCE) {
          closestDistance = distance;
          closestWall = wall;
        }
      });

      setHoveredPartialEraserWall(closestWall);
    } else {
      // 다른 도구일 때는 호버 상태 초기화
      setHoveredEraserWall(null);
      setHoveredSelectWall(null);
      setHoveredPartialEraserWall(null);
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
    hoveredEraserWall,
    hoveredSelectWall,
    hoveredPartialEraserWall,
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

  // 이미지 업로드 처리
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCachedBackgroundImage(null); // 캐시초기화
    setUploadedImage(null);
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
      const canvasWidth = 1600;
      const canvasHeight = 1200;

      // 이미지 비율과 캔버스 비율 계산
      const imgAspect = result.imageWidth / result.imageHeight;
      const canvasAspect = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawWidth = canvasWidth * 0.8; // 캔버스 크기의 80%로 제한
        drawHeight = drawWidth / imgAspect;
        drawX = -drawWidth / 2;
        drawY = -drawHeight / 2;
      } else {
        drawHeight = canvasHeight * 0.8; // 캔버스 크기의 80%로 제한
        drawWidth = drawHeight * imgAspect;
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
        containerWidth: canvasWidth,
        containerHeight: canvasHeight,
      });

      toast.success("벽 검출이 완료되었습니다!", {
        duration: 2000,
        position: "top-center",
        style: {marginTop : "80px",
         backgroundColor: "#333333", // 진한 회색
        color: "#FFFFFF"           // 흰색 글씨
        }
      });
    } catch (error) {
      console.error("Wall detection failed:", error);
      toast.error("벽 검출에 실패했습니다.", {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setIsProcessing(false);

      //[09.16] onchange 이벤트 발생 위해 값 초기화
      event.target.value = "";
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

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCreatedRoomId(null);
  };

  // 시뮬레이터로 이동 핸들러 (모달에서 확인 버튼 클릭시)
  const handleConfirmGoToSimulator = () => {
    if (createdRoomId) {
      router.push(`/sim/${createdRoomId}`);
    }
  };

  // 시뮬레이터로 이동 핸들러 (집 생성하기 onClick시 )
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

      // 이전 페이지가 create임을 저장
      sessionStorage.setItem("previousPage", "create");

      // 모달 표시를 위해 상태 설정
      setCreatedRoomId(roomId);
      setShowCreateModal(true);
    } catch (error) {
      console.error("Room creation failed:", error);
      alert("방 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* 툴바 */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-amber-100 px-4 lg:px-6 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:shadow-lg sticky top-0 z-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* 첫 번째 행: 로고, 제목, 완료 버튼 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-2xl hover:scale-110 transition-transform duration-200 cursor-pointer"
              >
                {/* [09.15] 메인아이콘 자리 */}
                <img
                  src="/asset/wheretoput.png"
                  alt="WheretoPut"
                  className="w-12 h-12 dark:bg-white dark:rounded-lg dark:p-0.5"
                />
              </Link>
              <h1 className="text-base lg:text-lg font-black text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                어따놀래
              </h1>
            </div>

            {/* 완료 버튼 (작은 화면에서 상단에 위치) */}
            <div className="lg:hidden">
              <button
                onClick={handleGoToSimulator}
                disabled={walls.length === 0 || isCreatingRoom}
                className="tool-btn tool-btn-active text-base px-6 py-4 font-semibold"
              >
                <Check size={20} />
                {isCreatingRoom ? "생성중..." : "집 생성하기"}
              </button>
            </div>
          </div>

          {/* 두 번째 행: 도구 그룹들 */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3 justify-center lg:justify-start">
            {/* 그리기 도구 그룹 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newTool = tool === "wall" ? "none" : "wall";
                  setTool(newTool);
                  if (tool === "select") {
                    setSelectedWall(null);
                    setEditingWallLength("");
                  }
                }}
                className={`tool-btn ${
                  tool === "wall" ? "tool-btn-active" : "tool-btn-inactive"
                }`}
              >
                <Brush size={18} />
                <span className="hidden sm:inline">드로잉</span>
                <span className="sm:hidden">벽</span>
              </button>

              <button
                onClick={() => {
                  const newTool = tool === "select" ? "none" : "select";
                  setTool(newTool);
                  if (newTool === "none") {
                    setSelectedWall(null);
                    setEditingWallLength("");
                  }
                }}
                className={`tool-btn ${
                  tool === "select" ? "tool-btn-active" : "tool-btn-inactive"
                }`}
              >
                <MousePointer size={14} />
                <span>선택</span>
              </button>
            </div>

            {/* 지우기 도구 그룹 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newTool = tool === "eraser" ? "none" : "eraser";
                  setTool(newTool);
                  if (tool === "select") {
                    setSelectedWall(null);
                    setEditingWallLength("");
                  }
                }}
                className={`tool-btn ${
                  tool === "eraser" ? "tool-btn-active" : "tool-btn-inactive"
                }`}
              >
                <Eraser size={14} />
                <span>지우기</span>
              </button>

              <button
                onClick={() => {
                  const newTool =
                    tool === "partial_eraser" ? "none" : "partial_eraser";
                  setTool(newTool);
                  if (tool === "select") {
                    setSelectedWall(null);
                    setEditingWallLength("");
                  }
                  setPartialEraserSelectedWall(null);
                  setIsSelectingEraseArea(false);
                  setEraseAreaStart(null);
                  setEraseAreaEnd(null);
                }}
                className={`tool-btn ${
                  tool === "partial_eraser"
                    ? "tool-btn-active"
                    : "tool-btn-inactive"
                }`}
              >
                <Scissors size={14} />
                <span className="hidden sm:inline">부분 지우기</span>
                <span className="sm:hidden">부분</span>
              </button>

              <button
                onClick={clearAllWalls}
                className="tool-btn tool-btn-inactive"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">전체 지우기</span>
                <span className="sm:hidden">전체</span>
              </button>
            </div>

            {/* 이미지 및 축척 도구 그룹 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="tool-btn tool-btn-inactive"
              >
                <Upload size={14} />
                <span>{isProcessing ? "처리중..." : "업로드"}</span>
              </button>

              <button
                onClick={() => {
                  setTool("scale");
                  setScaleWall(null);
                  setScaleRealLength("");
                }}
                disabled={!uploadedImage}
                className={`tool-btn ${
                  !uploadedImage
                    ? "tool-btn-inactive"
                    : tool === "scale"
                    ? "tool-btn-active"
                    : "tool-btn-inactive"
                }`}
              >
                <Square size={14} />
                <span>축척</span>
              </button>

              {uploadedImage && (
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setCachedBackgroundImage(null);
                    alert("배경 이미지가 제거되었습니다.");
                  }}
                  className="tool-btn tool-btn-inactive"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">배경 제거</span>
                  <span className="sm:hidden">배경</span>
                </button>
              )}
            </div>
          </div>

          {/* 완료 버튼 (큰 화면에서만 오른쪽에 위치) */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={handleGoToSimulator}
              disabled={walls.length === 0 || isCreatingRoom}
              className="tool-btn tool-btn-active px-8 py-4 text-lg font-bold"
            >
              <Check size={20} />
              {isCreatingRoom ? "방 생성 중..." : "집 생성하기"}
            </button>
          </div>

          {/* input의 onchange 는 파일을 선택하고 열기했을때발생 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 메인 작업 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 캔버스 영역 */}
        <div className="flex-1 p-0 overflow-hidden flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg border border-amber-100 overflow-hidden">
            <div
              ref={containerRef}
              className="relative"
              style={{ width: "1600px", height: "1200px" }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
                className="block"
                style={{
                  width: "1600",
                  height: "1200",
                  cursor:
                    tool === "wall"
                      ? "crosshair"
                      : tool === "eraser" && hoveredEraserWall
                      ? "pointer"
                      : tool === "select" && hoveredSelectWall
                      ? "pointer"
                      : tool === "partial_eraser" && hoveredPartialEraserWall
                      ? "pointer"
                      : tool === "none" || !tool
                      ? "grab"
                      : "default",
                }}
              />
            </div>
          </div>
        </div>

        {/* 사이드 패널 */}
        <div className="relative flex">
          {/* 토글 버튼 */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full z-10 bg-white/95 backdrop-blur-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 p-2 rounded-l-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
            style={{ borderRight: "none" }}
          >
            {isSidebarCollapsed ? (
              <ChevronLeft size={16} className="text-black dark:text-white" />
            ) : (
              <ChevronRight size={16} className="text-black dark:text-white" />
            )}
          </button>

          {/* 사이드바 컨텐츠 */}
          <div
            className={`bg-white/95 backdrop-blur-sm border-l border-gray-300 dark:border-gray-700 dark:bg-gray-800 overflow-y-auto flex-shrink-0 shadow-sm transition-all duration-300 ${
              isSidebarCollapsed ? "w-0 p-0" : "w-80 p-6"
            }`}
          >
            <div
              className={`${
                isSidebarCollapsed ? "opacity-0" : "opacity-100"
              } transition-opacity duration-300`}
            >
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4 tracking-tight">
                도구 정보
              </h3>

              {/* 축척 설정 도구 */}
              {tool === "scale" && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-lg">
                    축척 설정 도구
                  </h4>
                  {!scaleWall ? (
                    <p className="text-sm text-gray-700 dark:text-gray-100 mb-3">
                      기준이 될 벽을 그려주세요.
                    </p>
                  ) : (
                    <div>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-3">
                          실제 길이 (mm) :
                        </label>
                        <input
                          type="number"
                          value={scaleRealLength}
                          onChange={(e) => setScaleRealLength(e.target.value)}
                          placeholder="예: 3000"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={applyScale}
                          disabled={!scaleRealLength}
                          className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all cursor-pointer ${
                            !scaleRealLength
                              ? "tool-btn-inactive"
                              : "tool-btn-active"
                          } disabled:cursor-not-allowed`}
                        >
                          축척 적용
                        </button>
                        <button
                          onClick={() => {
                            setScaleWall(null);
                            setScaleRealLength("");
                            setTool("wall");
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors cursor-pointer dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tool === "select" && selectedWall && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-lg">
                    선택된 벽
                  </h4>
                  <p className="text-gray-800 dark:text-gray-100 mb-2 tracking-tight">
                    현재 길이 :{" "}
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
                      <label className="text-gray-800 dark:text-gray-100 mb-2 tracking-tight">
                        길이 조정 (mm) :
                      </label>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="number"
                          value={editingWallLength}
                          onChange={(e) => setEditingWallLength(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                          placeholder="길이 입력"
                        />
                        <button
                          onClick={() => {
                            const newLength = parseFloat(editingWallLength);
                            if (newLength && newLength > 0) {
                              adjustWallLength(selectedWall.id, newLength);
                            }
                          }}
                          className="px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          적용
                        </button>
                      </div>
                    </div>
                  )}

                  {!isScaleSet && (
                    <p className="text-xs text-gray-800 dark:text-gray-100 mb-2 tracking-tight">
                      정확한 길이 조정을 위해, '축척 설정'을 먼저 해주세요.
                    </p>
                  )}
                </div>
              )}

              {/* 뷰포트 컨트롤 */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-lg">
                  배율 조절
                </h4>

                <div className="mb-3">
                  <label className=" text-gray-800 dark:text-gray-100 mb-2 tracking-tight">
                    현재 배율 : {Math.round(viewScale * 100)} %
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
                    className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div>
                  <button
                    onClick={() => {
                      setViewScale(1);
                      setViewOffset({ x: 0, y: 0 });
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors cursor-pointer dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 flex items-center justify-center gap-2"
                  >
                    Reset <RotateCcw size={18} />
                  </button>
                </div>

                <p className="text-xs text-gray-800 dark:text-gray-100 mb-2 tracking-tight mt-4 flex gap-x-3">
                  <span>드래그 : 화면 이동 </span>
                  <span> | </span>
                  <span>휠 : 줌 In / Out</span>
                </p>
              </div>

              {/* 배경 이미지 투명도 조정 */}
              {uploadedImage && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-lg">
                    배경 이미지 설정
                  </h4>
                  <div className="mb-2">
                    <label className="text-gray-800 dark:text-gray-100 tracking-tight mb-1">
                      투명도 : {Math.round(backgroundOpacity * 100)} %
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
                      className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setCachedBackgroundImage(null);
                      alert("배경 이미지가 제거되었습니다.");
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors cursor-pointer dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  >
                    배경 제거
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 방 생성 완료 모달 */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmGoToSimulator}
        roomCount={walls.length}
      />
    </div>
  );
};

export default FloorPlanEditor;
