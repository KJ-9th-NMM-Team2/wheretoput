'use client'

import React from 'react'
import FloorPlanEditor from '../components/FloorPlanEditor.jsx'

export default function FloorPlanPage() {
  const handleFloorPlanChange = (walls) => {
    console.log('Floor plan updated:', walls)
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <FloorPlanEditor onFloorPlanChange={handleFloorPlanChange} />
    </div>
  )
}