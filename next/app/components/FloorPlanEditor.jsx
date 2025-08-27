import React, { useRef, useEffect, useState, useCallback } from 'react';

const FloorPlanEditor = ({ onFloorPlanChange }) => {
  const canvasRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [currentTool, setCurrentTool] = useState('wall');
  const [gridSize, setGridSize] = useState(20);
  const [wallWidth, setWallWidth] = useState(4);
  const [wallColor, setWallColor] = useState('#2c3e50');

  // Floor Plan Editor 클래스
  class FloorPlanEditorClass {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.gridSize = options.gridSize || 20;
      this.wallWidth = options.wallWidth || 4;
      this.wallColor = options.wallColor || '#2c3e50';
      this.currentTool = options.currentTool || 'wall';
      
      this.isDrawing = false;
      this.startPoint = null;
      this.walls = [];
      this.previewWall = null;
      
      this.initializeEventListeners();
      this.drawGrid();
    }
    
    initializeEventListeners() {
      this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
      this.canvas.addEventListener('mousemove', this.draw.bind(this));
      this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
      this.canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
    }
    
    snapToGrid(x, y) {
      return {
        x: Math.round(x / this.gridSize) * this.gridSize,
        y: Math.round(y / this.gridSize) * this.gridSize
      };
    }
    
    getMousePos(e) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    
    startDrawing(e) {
      if (this.currentTool === 'wall') {
        this.isDrawing = true;
        const mousePos = this.getMousePos(e);
        this.startPoint = this.snapToGrid(mousePos.x, mousePos.y);
      } else if (this.currentTool === 'erase') {
        const mousePos = this.getMousePos(e);
        this.eraseWall(mousePos.x, mousePos.y);
      }
    }
    
    draw(e) {
      if (this.currentTool === 'wall' && this.isDrawing && this.startPoint) {
        const mousePos = this.getMousePos(e);
        const endPoint = this.snapToGrid(mousePos.x, mousePos.y);
        
        // 수직 또는 수평선만 그리기
        if (Math.abs(endPoint.x - this.startPoint.x) > Math.abs(endPoint.y - this.startPoint.y)) {
          endPoint.y = this.startPoint.y; // 수평선
        } else {
          endPoint.x = this.startPoint.x; // 수직선
        }
        
        this.previewWall = {
          start: this.startPoint,
          end: endPoint,
          color: this.wallColor,
          width: this.wallWidth
        };
        
        this.redraw();
      }
    }
    
    stopDrawing() {
      if (this.isDrawing && this.previewWall) {
        // 길이가 있는 벽만 추가
        if (this.previewWall.start.x !== this.previewWall.end.x || 
            this.previewWall.start.y !== this.previewWall.end.y) {
          
          // 중복 벽 체크
          if (!this.isDuplicateWall(this.previewWall)) {
            this.walls.push({...this.previewWall});
            // React 부모 컴포넌트에 변경 알림
            if (this.onWallsChange) {
              this.onWallsChange(this.walls);
            }
          }
        }
      }
      
      this.isDrawing = false;
      this.startPoint = null;
      this.previewWall = null;
      this.redraw();
    }
    
    eraseWall(x, y) {
      for (let i = this.walls.length - 1; i >= 0; i--) {
        const wall = this.walls[i];
        if (this.isPointOnWall(x, y, wall)) {
          this.walls.splice(i, 1);
          if (this.onWallsChange) {
            this.onWallsChange(this.walls);
          }
          break;
        }
      }
      this.redraw();
    }
    
    isDuplicateWall(newWall) {
      return this.walls.some(existingWall => {
        return (
          (existingWall.start.x === newWall.start.x && 
           existingWall.start.y === newWall.start.y &&
           existingWall.end.x === newWall.end.x && 
           existingWall.end.y === newWall.end.y) ||
          (existingWall.start.x === newWall.end.x && 
           existingWall.start.y === newWall.end.y &&
           existingWall.end.x === newWall.start.x && 
           existingWall.end.y === newWall.start.y)
        );
      });
    }

    isPointOnWall(x, y, wall) {
      const tolerance = this.wallWidth + 5;
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) return false;
      
      const dot = ((x - wall.start.x) * dx + (y - wall.start.y) * dy) / (length * length);
      
      if (dot < 0 || dot > 1) return false;
      
      const projX = wall.start.x + dot * dx;
      const projY = wall.start.y + dot * dy;
      const distance = Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
      
      return distance <= tolerance;
    }
    
    drawGrid() {
      this.ctx.save();
      this.ctx.strokeStyle = '#ecf0f1';
      this.ctx.lineWidth = 0.5;
      this.ctx.globalAlpha = 0.3;
      
      // 세로선
      for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      
      // 가로선
      for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    }
    
    drawWall(wall) {
      this.ctx.strokeStyle = wall.color;
      this.ctx.lineWidth = wall.width;
      this.ctx.lineCap = 'square';
      
      this.ctx.beginPath();
      this.ctx.moveTo(wall.start.x, wall.start.y);
      this.ctx.lineTo(wall.end.x, wall.end.y);
      this.ctx.stroke();
    }
    
    redraw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawGrid();
      
      // 기존 벽들 그리기
      this.walls.forEach(wall => this.drawWall(wall));
      
      // 미리보기 벽 그리기
      if (this.previewWall) {
        this.ctx.strokeStyle = this.previewWall.color;
        this.ctx.lineWidth = this.previewWall.width;
        this.ctx.globalAlpha = 0.7;
        this.drawWall(this.previewWall);
        this.ctx.globalAlpha = 1.0;
      }
    }
    
    updateSettings(settings) {
      if (settings.gridSize) {
        this.gridSize = settings.gridSize;
      }
      if (settings.wallWidth) {
        this.wallWidth = settings.wallWidth;
      }
      if (settings.wallColor) {
        this.wallColor = settings.wallColor;
      }
      if (settings.currentTool) {
        this.currentTool = settings.currentTool;
      }
      this.redraw();
    }
    
    clearCanvas() {
      this.walls = [];
      this.redraw();
      if (this.onWallsChange) {
        this.onWallsChange(this.walls);
      }
    }
    
    exportCleanImage() {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = this.canvas.width;
      exportCanvas.height = this.canvas.height;
      const exportCtx = exportCanvas.getContext('2d');
      
      // 흰색 배경
      exportCtx.fillStyle = '#FFFFFF';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      
      exportCtx.imageSmoothingEnabled = false;
      
      // 벽만 그리기 (격자 완전 제외)
      if (this.walls && this.walls.length > 0) {
        this.walls.forEach(wall => {
          if (wall.color !== '#ecf0f1' && wall.width > 1) {
            exportCtx.strokeStyle = wall.color;
            exportCtx.lineWidth = wall.width;
            exportCtx.lineCap = 'square';
            exportCtx.lineJoin = 'miter';
            
            exportCtx.beginPath();
            exportCtx.moveTo(wall.start.x, wall.start.y);
            exportCtx.lineTo(wall.end.x, wall.end.y);
            exportCtx.stroke();
          }
        });
      }
      
      return exportCanvas.toDataURL('image/png');
    }
    
    loadTemplate() {
      this.walls = [];
      
      // 기본 방 템플릿
      const roomTemplate = [
        { start: {x: 100, y: 100}, end: {x: 500, y: 100}, color: '#2c3e50', width: 6 },
        { start: {x: 500, y: 100}, end: {x: 500, y: 400}, color: '#2c3e50', width: 6 },
        { start: {x: 500, y: 400}, end: {x: 100, y: 400}, color: '#2c3e50', width: 6 },
        { start: {x: 100, y: 400}, end: {x: 100, y: 100}, color: '#2c3e50', width: 6 },
        { start: {x: 300, y: 100}, end: {x: 300, y: 250}, color: '#34495e', width: 4 },
        { start: {x: 100, y: 250}, end: {x: 500, y: 250}, color: '#34495e', width: 4 }
      ];
      
      this.walls = roomTemplate;
      this.redraw();
      
      if (this.onWallsChange) {
        this.onWallsChange(this.walls);
      }
    }
  }

  // Canvas 초기화
  useEffect(() => {
    if (canvasRef.current && !editor) {
      const newEditor = new FloorPlanEditorClass(canvasRef.current, {
        gridSize,
        wallWidth,
        wallColor,
        currentTool
      });
      
      // React 상태 변경 콜백 설정
      newEditor.onWallsChange = (walls) => {
        if (onFloorPlanChange) {
          onFloorPlanChange(walls);
        }
      };
      
      setEditor(newEditor);
    }
  }, []);

  // 설정 변경 시 에디터 업데이트
  useEffect(() => {
    if (editor) {
      editor.updateSettings({
        gridSize,
        wallWidth,
        wallColor,
        currentTool
      });
    }
  }, [editor, gridSize, wallWidth, wallColor, currentTool]);

  const handleToolChange = (tool) => {
    setCurrentTool(tool);
  };

  const handleClear = () => {
    if (editor && window.confirm('모든 그림을 지우시겠습니까?')) {
      editor.clearCanvas();
    }
  };

  const handleSave = () => {
    if (editor) {
      const dataURL = editor.exportCleanImage();
      const link = document.createElement('a');
      link.download = 'floor_plan_clean.png';
      link.href = dataURL;
      link.click();
    }
  };

  const handleLoadTemplate = () => {
    if (editor && window.confirm('기본 템플릿을 불러오시겠습니까? (현재 그림은 지워집니다)')) {
      editor.loadTemplate();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      fontFamily: 'Arial, sans-serif' 
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '15px',
        textAlign: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0 }}>🏠 도면 그리기 - 격자 벽 드래그 에디터</h2>
      </div>
      
      {/* Toolbar */}
      <div style={{
        backgroundColor: '#34495e',
        padding: '10px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        {/* Tool Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => handleToolChange('wall')}
            style={{
              backgroundColor: currentTool === 'wall' ? '#e74c3c' : '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🧱 벽 그리기
          </button>
          <button
            onClick={() => handleToolChange('erase')}
            style={{
              backgroundColor: currentTool === 'erase' ? '#e74c3c' : '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🧹 지우기
          </button>
          <button
            onClick={handleClear}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ 전체 지우기
          </button>
        </div>
        
        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ color: '#ecf0f1', marginRight: '10px' }}>벽 색상:</label>
          <input 
            type="color" 
            value={wallColor}
            onChange={(e) => setWallColor(e.target.value)}
            style={{
              width: '40px',
              height: '30px',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ color: '#ecf0f1' }}>격자 크기:</label>
          <input 
            type="range" 
            min="10" 
            max="50" 
            value={gridSize}
            onChange={(e) => setGridSize(parseInt(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ color: '#ecf0f1', fontSize: '12px' }}>{gridSize}px</span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ color: '#ecf0f1' }}>벽 두께:</label>
          <input 
            type="range" 
            min="2" 
            max="10" 
            value={wallWidth}
            onChange={(e) => setWallWidth(parseInt(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ color: '#ecf0f1', fontSize: '12px' }}>{wallWidth}px</span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleLoadTemplate}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📋 템플릿
          </button>
          <button
            onClick={handleSave}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💾 저장
          </button>
        </div>
      </div>
      
      {/* Canvas Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        overflow: 'auto',
        backgroundColor: '#f0f0f0'
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            border: '2px solid #2c3e50',
            backgroundColor: 'white',
            cursor: currentTool === 'wall' ? 'crosshair' : 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}
        />
      </div>
      
      {/* Info Panel */}
      <div style={{
        backgroundColor: '#ecf0f1',
        padding: '10px',
        borderTop: '1px solid #bdc3c7',
        fontSize: '12px',
        color: '#7f8c8d'
      }}>
        마우스를 드래그하여 벽을 그릴 수 있습니다. 격자에 맞춰 자동으로 정렬됩니다. | 도구: 벽 그리기/지우기 | 컨트롤: 격자 크기, 벽 색상, 벽 두께 조절 가능
      </div>
    </div>
  );
};

export default FloorPlanEditor;