/**
 * Utility functions for camera positioning and centering
 */

interface WallData {
  position: [number, number, number];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  rotation?: [number, number, number];
}

/**
 * Calculate the center point of all walls
 * @param wallsData Array of wall data objects
 * @returns The center point [x, y, z] of all walls
 */
export function calculateWallsCenter(wallsData: WallData[]): [number, number, number] {
  if (!wallsData || wallsData.length === 0) {
    // Return default center if no walls
    return [0, 0, 0];
  }

  // Calculate the bounding box of all wall endpoints
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  wallsData.forEach((wall) => {
    const { position, rotation = [0, 0, 0], dimensions } = wall;
    
    if (dimensions?.width) {
      // Calculate wall endpoints based on position, rotation, and width
      const halfWidth = dimensions.width / 2;
      const angle = rotation[1]; // Y-axis rotation
      
      // Calculate the two endpoints of the wall
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const endpoint1X = position[0] - halfWidth * cos;
      const endpoint1Z = position[2] - halfWidth * sin;
      const endpoint2X = position[0] + halfWidth * cos;
      const endpoint2Z = position[2] + halfWidth * sin;
      
      // Update bounding box with both endpoints
      minX = Math.min(minX, endpoint1X, endpoint2X);
      maxX = Math.max(maxX, endpoint1X, endpoint2X);
      minZ = Math.min(minZ, endpoint1Z, endpoint2Z);
      maxZ = Math.max(maxZ, endpoint1Z, endpoint2Z);
    } else {
      // Fallback: just use wall position if dimensions are not available
      minX = Math.min(minX, position[0]);
      maxX = Math.max(maxX, position[0]);
      minZ = Math.min(minZ, position[2]);
      maxZ = Math.max(maxZ, position[2]);
    }
  });

  // Calculate center point
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  
  return [centerX, 0, centerZ];
}

/**
 * Calculate optimal camera position based on walls center
 * @param wallsCenter The center point of walls [x, y, z]
 * @param wallsData Array of wall data objects for calculating optimal distance
 * @returns Camera position [x, y, z]
 */
export function calculateOptimalCameraPosition(
  wallsCenter: [number, number, number],
  wallsData: WallData[]
): [number, number, number] {
  const [centerX, , centerZ] = wallsCenter;
  
  // Default camera height and distance
  let cameraHeight = 20;
  let cameraDistance = 30;
  
  if (wallsData && wallsData.length > 0) {
    // Calculate room size to adjust camera distance
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    
    wallsData.forEach((wall) => {
      const { position, rotation = [0, 0, 0], dimensions } = wall;
      
      if (dimensions?.width) {
        const halfWidth = dimensions.width / 2;
        const angle = rotation[1];
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const endpoint1X = position[0] - halfWidth * cos;
        const endpoint1Z = position[2] - halfWidth * sin;
        const endpoint2X = position[0] + halfWidth * cos;
        const endpoint2Z = position[2] + halfWidth * sin;
        
        minX = Math.min(minX, endpoint1X, endpoint2X);
        maxX = Math.max(maxX, endpoint1X, endpoint2X);
        minZ = Math.min(minZ, endpoint1Z, endpoint2Z);
        maxZ = Math.max(maxZ, endpoint1Z, endpoint2Z);
      }
    });
    
    if (minX !== Infinity && maxX !== -Infinity && minZ !== Infinity && maxZ !== -Infinity) {
      // Calculate room dimensions
      const roomWidth = maxX - minX;
      const roomDepth = maxZ - minZ;
      const roomSize = Math.max(roomWidth, roomDepth);
      
      // Adjust camera distance based on room size
      // Minimum distance 20, scales with room size
      cameraDistance = Math.max(20, roomSize * 1.5);
      
      // Adjust camera height based on room size
      cameraHeight = Math.max(15, roomSize * 0.8);
    }
  }
  
  return [centerX, cameraHeight, centerZ + cameraDistance];
}

/**
 * Get camera target position (where camera looks at)
 * @param wallsCenter The center point of walls [x, y, z]
 * @returns Target position [x, y, z]
 */
export function getCameraTarget(wallsCenter: [number, number, number]): [number, number, number] {
  const [centerX, , centerZ] = wallsCenter;
  return [centerX, 0, centerZ];
}