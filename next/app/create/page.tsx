"use client";

import FloorPlanEditor from "../components/FloorPlanEditor.jsx";

export default function CreatePage() {
  const handleFloorPlanChange = (walls: any[]) => {
    // console.log('Floor plan updated:', walls)
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <FloorPlanEditor />
    </div>
  );
}
