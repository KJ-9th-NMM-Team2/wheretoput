import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WallDetector } from '../wallDetection.js';
import { useRouter } from 'next/navigation';

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
  const [editingWallLength, setEditingWallLength] = useState('');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3);
  const [cachedBackgroundImage, setCachedBackgroundImage] = useState(null);
  
  // 부분 지우기 관련 상태
  const [partialEraserSelectedWall, setPartialEraserSelectedWall] = useState(null);
  const [isSelectingEraseArea, setIsSelectingEraseArea] = useState(false);
  const [eraseAreaStart, setEraseAreaStart] = useState(null);
  const [eraseAreaEnd, setEraseAreaEnd] = useState(null);
  
  const fileInputRef = useRef(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // 축척 설정 관련 상태
  const [showScalePopup, setShowScalePopup] = useState(false);
  const [scaleImage, setScaleImage] = useState(null);
  const [scalePoints, setScalePoints] = useState([]);
  const [realLength, setRealLength] = useState('');
  const [isDrawingScale, setIsDrawingScale] = useState(false);
  const [scaleStartPoint, setScaleStartPoint] = useState(null);
  const [scaleCurrentPoint, setScaleCurrentPoint] = useState(null);
  const [pixelToMmRatio, setPixelToMmRatio] = useState(20); // 1픽셀 = 20mm (기본값)

  const GRID_SIZE = 20; // 격자 크기 축소 (500mm당 25px)

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

  // 벽 길이 조정 함수
  const adjustWallLength = (wallId, newLengthMm) => {
    setWalls(prevWalls => {
      return prevWalls.map(wall => {
        if (wall.id === wallId) {
          const currentLength = calculateDistance(wall.start, wall.end);
          if (currentLength === 0) return wall;
          
          // 현재 벡터 계산
          const dx = wall.end.x - wall.start.x;
          const dy = wall.end.y - wall.start.y;
          const currentPixelLength = Math.sqrt(dx * dx + dy * dy);
          
          // 새로운 픽셀 길이 계산
          const newPixelLength = newLengthMm / pixelToMmRatio;
          const scale = newPixelLength / currentPixelLength;
          
          // 새로운 끝점 계산 (시작점 고정)
          const newEnd = {
            x: wall.start.x + dx * scale,
            y: wall.start.y + dy * scale
          };
          
          // 격자에 스냅
          const snappedEnd = snapToGrid(newEnd.x, newEnd.y);
          
          return {
            ...wall,
            end: snappedEnd
          };
        }
        return wall;
      });
    });
  };

  // 선분을 부분적으로 잘라내는 함수
  const partialEraseWall = (wallId, eraseStart, eraseEnd) => {
    setWalls(prevWalls => {
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
          
          const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSq;
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
            y: wall.start.y + (wall.end.y - wall.start.y) * tStart
          };
          const snappedEnd = snapToGrid(newEnd.x, newEnd.y);
          
          resultWalls.push({
            id: Date.now() + Math.random(),
            start: wall.start,
            end: snappedEnd
          });
        }

        // 두 번째 부분 (지울 영역 끝부터 끝점까지)
        if (tEnd < 0.95) {
          const newStart = {
            x: wall.start.x + (wall.end.x - wall.start.x) * tEnd,
            y: wall.start.y + (wall.end.y - wall.start.y) * tEnd
          };
          const snappedStart = snapToGrid(newStart.x, newStart.y);
          
          resultWalls.push({
            id: Date.now() + Math.random() + 1,
            start: snappedStart,
            end: wall.end
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
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext("2d");

    // 컨테이너의 실제 크기를 기준으로 캔버스 크기 설정
    const containerRect = container.getBoundingClientRect();
    
    // 고해상도 렌더링 설정
    const dpr = window.devicePixelRatio || 1;
    
    // 캔버스 실제 해상도 설정 (컨테이너 크기 기준)
    canvas.width = containerRect.width * dpr;
    canvas.height = containerRect.height * dpr;
    
    // CSS 크기는 컨테이너에 맞춤
    canvas.style.width = containerRect.width + 'px';
    canvas.style.height = containerRect.height + 'px';
    
    // 컨텍스트 스케일 조정
    ctx.scale(dpr, dpr);

    // 전체 캔버스 클리어
    ctx.clearRect(0, 0, containerRect.width, containerRect.height);

    // rect를 containerRect로 업데이트
    const rect = containerRect;

    // 배경 이미지 그리기 (업로드된 이미지가 있는 경우)
    if (uploadedImage && cachedBackgroundImage) {
      // 캐시된 이미지 사용
      const img = cachedBackgroundImage;
      
      // 이미지를 캔버스 크기에 맞춰 스케일링하여 그리기
      const imgAspect = img.width / img.height;
      const canvasAspect = rect.width / rect.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > canvasAspect) {
        // 이미지가 캔버스보다 가로로 긴 경우
        drawWidth = rect.width;
        drawHeight = rect.width / imgAspect;
        drawX = 0;
        drawY = (rect.height - drawHeight) / 2;
      } else {
        // 이미지가 캔버스보다 세로로 긴 경우
        drawHeight = rect.height;
        drawWidth = rect.height * imgAspect;
        drawX = (rect.width - drawWidth) / 2;
        drawY = 0;
      }
      
      // 투명도 설정 (배경 이미지가 격자와 벽을 가리지 않도록)
      ctx.globalAlpha = backgroundOpacity;
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.globalAlpha = 1.0;
      
      // 격자와 벽 그리기
      drawGridAndWalls(ctx, rect);
    } else if (uploadedImage && !cachedBackgroundImage) {
      // 처음 로드하는 경우에만 새 이미지 객체 생성
      const img = new Image();
      img.onload = () => {
        // 이미지를 캐시에 저장
        setCachedBackgroundImage(img);
        
        // 이미지를 캔버스 크기에 맞춰 스케일링하여 그리기
        const imgAspect = img.width / img.height;
        const canvasAspect = rect.width / rect.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          // 이미지가 캔버스보다 가로로 긴 경우
          drawWidth = rect.width;
          drawHeight = rect.width / imgAspect;
          drawX = 0;
          drawY = (rect.height - drawHeight) / 2;
        } else {
          // 이미지가 캔버스보다 세로로 긴 경우
          drawHeight = rect.height;
          drawWidth = rect.height * imgAspect;
          drawX = (rect.width - drawWidth) / 2;
          drawY = 0;
        }
        
        // 투명도 설정 (배경 이미지가 격자와 벽을 가리지 않도록)
        ctx.globalAlpha = backgroundOpacity;
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0;
        
        // 이미지 그리기 완료 후 격자와 벽 다시 그리기
        drawGridAndWalls(ctx, rect);
      };
      img.src = uploadedImage;
    } else {
      // 배경 이미지가 없는 경우 바로 격자와 벽 그리기
      drawGridAndWalls(ctx, rect);
    }
  };

  // 격자와 벽 그리기 함수 분리
  const drawGridAndWalls = (ctx, rect) => {
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
      const isPartialEraserSelected = partialEraserSelectedWall?.id === wall.id;
      
      // 벽 그리기 (선택된 벽은 다른 색상)
      if (isPartialEraserSelected) {
        ctx.strokeStyle = "#ff0000"; // 부분 지우기 선택된 벽은 빨간색
        ctx.lineWidth = 5;
      } else if (isSelected) {
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 8;
      } else {
        ctx.strokeStyle = "#ff6600";
        ctx.lineWidth = 3;
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

      drawText(ctx, `${distance}mm`, midX, midY, angle);
    });

    // 부분 지우기 영역 표시 , 컬러설정
    if (isSelectingEraseArea && eraseAreaStart && eraseAreaEnd) {
      ctx.strokeStyle = "#0004ffff";
      ctx.lineWidth = 8;
      ctx.setLineDash([10, 10]);
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
        const newSelectedWall = selectedWall?.id === closestWall.id ? null : closestWall;
        setSelectedWall(newSelectedWall);
        if (newSelectedWall) {
          setEditingWallLength(calculateDistance(newSelectedWall.start, newSelectedWall.end).toString());
        } else {
          setEditingWallLength('');
        }
      } else {
        setSelectedWall(null);
        setEditingWallLength('');
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
    if (isDrawing && tool === "wall") {
      const coords = getCanvasCoordinates(e);
      const snapped = snapToGrid(coords.x, coords.y);
      setCurrentPoint(snapped);
    } else if (isSelectingEraseArea && tool === "partial_eraser") {
      const coords = getCanvasCoordinates(e);
      setEraseAreaEnd(coords);
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
    } else if (isSelectingEraseArea && tool === "partial_eraser" && partialEraserSelectedWall) {
      // 부분 지우기 실행
      if (eraseAreaStart && eraseAreaEnd) {
        partialEraseWall(partialEraserSelectedWall.id, eraseAreaStart, eraseAreaEnd);
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
  }, [walls, isDrawing, startPoint, currentPoint, selectedWall, uploadedImage, backgroundOpacity, cachedBackgroundImage, partialEraserSelectedWall, isSelectingEraseArea, eraseAreaStart, eraseAreaEnd]);

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

  // 윈도우 리사이즈 및 컨테이너 크기 변화 감지
  useEffect(() => {
    let resizeTimeout;
    let resizeObserverTimeout;
    
    const handleResize = () => {
      // 이전 타이머 취소
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      // 캔버스 크기를 즉시 업데이트
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }
      
      // 디바운스된 캔버스 다시 그리기
      resizeTimeout = setTimeout(() => {
        drawCanvas();
      }, 100);
    };

    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', handleResize);
    
    // ResizeObserver로 컨테이너 크기 변화 직접 감지
    let resizeObserver;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        // 이전 타이머 취소
        if (resizeObserverTimeout) {
          clearTimeout(resizeObserverTimeout);
        }
        
        for (let entry of entries) {
          // 컨테이너 크기가 변경될 때마다 캔버스 크기 강제 업데이트
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
          }
        }
        
        // 디바운스된 캔버스 다시 그리기
        resizeObserverTimeout = setTimeout(() => {
          drawCanvas();
        }, 50);
      });
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
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
  }, []); // 의존성을 빈 배열로 변경하여 불필요한 재생성 방지

  // 축척 설정용 마우스 이벤트 핸들러들
  const handleScaleMouseDown = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setScaleStartPoint({ x, y });
    setScaleCurrentPoint({ x, y });
    setIsDrawingScale(true);
    setScalePoints([]);
  };

  const handleScaleMouseMove = (e) => {
    if (!isDrawingScale || !scaleStartPoint) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setScaleCurrentPoint({ x, y });
  };

  const handleScaleMouseUp = (e) => {
    if (!isDrawingScale || !scaleStartPoint) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 최소 거리 체크 (너무 짧은 선분 방지)
    const distance = Math.sqrt(
      Math.pow(x - scaleStartPoint.x, 2) + Math.pow(y - scaleStartPoint.y, 2)
    );
    
    if (distance > 10) { // 10픽셀 이상일 때만 선분 생성
      setScalePoints([scaleStartPoint, { x, y }]);
    }
    
    setIsDrawingScale(false);
    setScaleStartPoint(null);
    setScaleCurrentPoint(null);
  };

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
    setIsDrawingScale(false);
    setScaleStartPoint(null);
    setScaleCurrentPoint(null);
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

  // 시뮬레이터로 이동 핸들러
  const handleGoToSimulator = async () => {
    if (walls.length === 0) {
      alert('먼저 도면을 그려주세요.');
      return;
    }

    setIsCreatingRoom(true);
    
    try {
      // 도면 데이터 준비
      const roomData = {
        title: `Floor Plan Room ${new Date().toLocaleString()}`,
        description: `Generated from floor plan with ${walls.length} walls`,
        is_public: false,
        walls: walls,
        pixelToMmRatio: pixelToMmRatio
      };
      
      // 서버에 룸 생성 요청
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData)
      });

      if (!response.ok) {
        throw new Error('룸 생성에 실패했습니다.');
      }

      const createdRoom = await response.json();
      
      // 생성된 정식 room_id로 시뮬레이터 페이지 이동
      router.push(`/sim/${createdRoom.id}`);
      
      alert(`${walls.length}개의 벽으로 구성된 방이 생성되었습니다! 시뮬레이터에서 꾸며보세요.`);
      
    } catch (error) {
      console.error('Room creation failed:', error);
      alert('방 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCreatingRoom(false);
    }
  };


  return (
    <div className="w-full min-h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] bg-orange-50 flex flex-col overflow-hidden">
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
                  className="w-full max-h-96 object-contain cursor-crosshair block select-none"
                  style={{ userSelect: 'none' }}
                  onMouseDown={handleScaleMouseDown}
                  onMouseMove={handleScaleMouseMove}
                  onMouseUp={handleScaleMouseUp}
                  draggable={false}
                />
                
                {/* 완성된 선분 표시 */}
                {scalePoints.length === 2 && (
                  <>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      <line
                        x1={scalePoints[0].x}
                        y1={scalePoints[0].y}
                        x2={scalePoints[1].x}
                        y2={scalePoints[1].y}
                        stroke="#0066ff"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {/* 시작점 */}
                      <circle
                        cx={scalePoints[0].x}
                        cy={scalePoints[0].y}
                        r="4"
                        fill="#0066ff"
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* 끝점 */}
                      <circle
                        cx={scalePoints[1].x}
                        cy={scalePoints[1].y}
                        r="4"
                        fill="#0066ff"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>
                  </>
                )}
                
                {/* 그리고 있는 선분 표시 */}
                {isDrawingScale && scaleStartPoint && scaleCurrentPoint && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line
                      x1={scaleStartPoint.x}
                      y1={scaleStartPoint.y}
                      x2={scaleCurrentPoint.x}
                      y2={scaleCurrentPoint.y}
                      stroke="#66aaff"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="5,5"
                    />
                    {/* 시작점 */}
                    <circle
                      cx={scaleStartPoint.x}
                      cy={scaleStartPoint.y}
                      r="3"
                      fill="#66aaff"
                      stroke="white"
                      strokeWidth="1"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700">
                {scalePoints.length === 0 && !isDrawingScale && "1. 이미지에서 기준이 될 길이를 드래그하여 선분을 그어주세요"}
                {isDrawingScale && "드래그하여 기준 선분을 그어주세요..."}
                {scalePoints.length === 2 && "2. 아래에 그은 선분의 실제 길이를 입력하세요"}
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
                  className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400
                  text-gray-900"
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
                onClick={() => {
                  setScalePoints([]);
                  setIsDrawingScale(false);
                  setScaleStartPoint(null);
                  setScaleCurrentPoint(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={isProcessing}
              >
                다시 그리기
              </button>
              <button
                onClick={() => {
                  setShowScalePopup(false);
                  setScaleImage(null);
                  setScalePoints([]);
                  setIsDrawingScale(false);
                  setScaleStartPoint(null);
                  setScaleCurrentPoint(null);
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

            {uploadedImage && (
              <button
                onClick={() => {
                  setUploadedImage(null);
                  setCachedBackgroundImage(null);
                  alert('배경 이미지가 제거되었습니다.');
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
              {isCreatingRoom ? '방 생성 중...' : '선택된 도면으로 우리 집 꾸미기'}
            </button>
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-md"
            >
              <Check size={18} />
              도면 저장
            </button>
          </div>
        </div>
      </div>

      {/* 메인 작업 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 캔버스 영역 */}
        <div className="flex-1 p-6 overflow-hidden">
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
        <div className="w-80 bg-orange-100 border-l border-orange-200 p-6 overflow-y-auto flex-shrink-0">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">
            도구 정보
          </h3>

          {/* 배경 이미지 투명도 조정 */}
          {uploadedImage && (
            <div className="bg-white p-4 rounded-lg border border-orange-200 mb-4">
              <h4 className="font-medium text-orange-700 mb-2">배경 이미지 설정</h4>
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
                  onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <button
                onClick={() => {
                  setUploadedImage(null);
                  setCachedBackgroundImage(null);
                  alert('배경 이미지가 제거되었습니다.');
                }}
                className="w-full px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                배경 이미지 제거
              </button>
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
                    현재 길이: {calculateDistance(selectedWall.start, selectedWall.end)}mm
                  </p>
                  
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
                  
                  <button
                    onClick={() => {
                      setWalls((prev) => prev.filter((wall) => wall.id !== selectedWall.id));
                      setSelectedWall(null);
                      setEditingWallLength('');
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
              <h4 className="font-medium text-orange-700 mb-2">부분 지우기 모드</h4>
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
