// Test scenarios for camera centering
// This can be used to manually test different wall configurations

export const testScenarios = {
  // Default centered room (existing behavior)
  defaultRoom: [
    { position: [0, 2.5, -10], rotation: [0, 0, 0], dimensions: { width: 20, height: 5, depth: 0.15 } },
    { position: [-10, 2.5, 0], rotation: [0, Math.PI / 2, 0], dimensions: { width: 20, height: 5, depth: 0.15 } },
    { position: [10, 2.5, 0], rotation: [0, -Math.PI / 2, 0], dimensions: { width: 20, height: 5, depth: 0.15 } },
    { position: [0, 2.5, 10], rotation: [0, Math.PI, 0], dimensions: { width: 20, height: 5, depth: 0.15 } }
  ],

  // Small room offset to the right
  offsetRoom: [
    { position: [50, 2.5, 40], rotation: [0, 0, 0], dimensions: { width: 10, height: 5, depth: 0.15 } },
    { position: [45, 2.5, 45], rotation: [0, Math.PI / 2, 0], dimensions: { width: 10, height: 5, depth: 0.15 } },
    { position: [55, 2.5, 45], rotation: [0, -Math.PI / 2, 0], dimensions: { width: 10, height: 5, depth: 0.15 } },
    { position: [50, 2.5, 50], rotation: [0, Math.PI, 0], dimensions: { width: 10, height: 5, depth: 0.15 } }
  ],

  // Large room
  largeRoom: [
    { position: [0, 2.5, -25], rotation: [0, 0, 0], dimensions: { width: 50, height: 5, depth: 0.15 } },
    { position: [-25, 2.5, 0], rotation: [0, Math.PI / 2, 0], dimensions: { width: 50, height: 5, depth: 0.15 } },
    { position: [25, 2.5, 0], rotation: [0, -Math.PI / 2, 0], dimensions: { width: 50, height: 5, depth: 0.15 } },
    { position: [0, 2.5, 25], rotation: [0, Math.PI, 0], dimensions: { width: 50, height: 5, depth: 0.15 } }
  ],

  // L-shaped room
  lShapedRoom: [
    { position: [0, 2.5, -10], rotation: [0, 0, 0], dimensions: { width: 20, height: 5, depth: 0.15 } },
    { position: [-10, 2.5, 0], rotation: [0, Math.PI / 2, 0], dimensions: { width: 20, height: 5, depth: 0.15 } },
    { position: [10, 2.5, -5], rotation: [0, -Math.PI / 2, 0], dimensions: { width: 10, height: 5, depth: 0.15 } },
    { position: [5, 2.5, 0], rotation: [0, Math.PI, 0], dimensions: { width: 10, height: 5, depth: 0.15 } }
  ],

  // Empty room (fallback test)
  emptyRoom: []
};

// Expected results for each scenario
export const expectedResults = {
  defaultRoom: {
    center: [0, 0, 0],
    cameraPosition: [0, 20, 30], // Should maintain roughly the same position for backward compatibility
    cameraTarget: [0, 0, 0]
  },
  offsetRoom: {
    center: [50, 0, 45],
    cameraPosition: [50, 15, 60], // Centered on the offset room with appropriate distance
    cameraTarget: [50, 0, 45]
  },
  largeRoom: {
    center: [0, 0, 0],
    cameraPosition: [0, 40, 75], // Further back and higher for large room
    cameraTarget: [0, 0, 0]
  },
  emptyRoom: {
    center: [0, 0, 0],
    cameraPosition: [0, 20, 30], // Fallback to default
    cameraTarget: [0, 0, 0]
  }
};