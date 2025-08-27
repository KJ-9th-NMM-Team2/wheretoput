// Simulation controls component
// Team: 수연, 성진
'use client';

import { useState } from 'react';
import Button from '../ui/Button';

export default function SimulationControls() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">시뮬레이션 제어</h3>
      
      <div className="space-y-4">
        <div>
          <Button 
            onClick={handleStartStop}
            variant={isRunning ? 'secondary' : 'primary'}
          >
            {isRunning ? '정지' : '시작'}
          </Button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            속도: {speed}x
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}