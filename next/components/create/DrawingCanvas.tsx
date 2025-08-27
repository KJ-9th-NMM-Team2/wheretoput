// Drawing canvas component for create page
// Team: 종호
'use client';

import { useRef, useEffect } from 'react';

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">도면 캔버스</h3>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 cursor-crosshair"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}