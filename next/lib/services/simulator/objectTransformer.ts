import cacheUtils from "@/lib/cache/CacheUtils";
import { RoomObjectTransformer } from "@/types/simulator";


export const objectTransformer = async (roomObjects: RoomObjectTransformer[]) => {
    return await Promise.all( 
        roomObjects.map(async (obj) => {
        // position JSON에서 값 추출
        const pos = obj.position as any;
        const rot = obj.rotation as any;
        const scale = obj.scale as any;

        // cached_model_url이 있으면 API 경로 사용, 없으면 원본 URL 사용
        const hasCachedModel = obj.furnitures?.cached_model_url?.includes("/cache/models/");
        const hasFurniture = obj.furnitures && obj.furniture_id;

        if (hasCachedModel) {
            console.log(
            `🎃 Using cached file via API: ${obj.furnitures.cached_model_url}`
            );
        } 
        else {
            await processCacheMissing(obj);
        }

        return {
            id: `object-${obj.object_id}`, // Three.js에서 사용할 고유 ID
            object_id: obj.object_id, // DB의 객체 ID
            furniture_id: obj.furniture_id,
            name: hasFurniture ? obj.furnitures.name : "Custom Object", // InfoPanel에서 사용하는 name 속성
            position: [pos?.x || 0, pos?.y || 0, pos?.z || 0],
            rotation: [rot?.x || 0, rot?.y || 0, rot?.z || 0],
            length: [
            Number(obj.furnitures?.length_x),
            Number(obj.furnitures?.length_y),
            Number(obj.furnitures?.length_z),
            ],
            scale: [scale?.x || 1, scale?.y || 1, scale?.z || 1],
            // furniture 테이블의 정보 활용 (furniture_id가 있는 경우만)
            url:
            hasFurniture && hasCachedModel
                ? `/api/models/cache/${obj.furnitures.cached_model_url?.replace(
                    "/cache/models/",
                    ""
                )}`
                : obj.furnitures?.model_url || "/legacy_mesh (1).glb",
            isCityKit: hasFurniture
            ? obj.furnitures.model_url?.includes("citykit") || false
            : false,
            texturePath: null, // texture_url 필드가 스키마에 없음
            type: hasFurniture
            ? obj.furnitures.model_url?.endsWith(".glb")
                ? "glb"
                : "building"
            : "custom",
            // 추가 메타데이터
            furnitureName: hasFurniture ? obj.furnitures.name : "Custom Object",
            categoryId: hasFurniture ? obj.furnitures.category_id : null,
        };
        })
    );
}

const processCacheMissing = async (obj: any) => {
  console.log(`👿 Cache missing: ${obj.furnitures.name}`);
  try {
    const filename = `${obj.furnitures.furniture_id}.glb`;
    const localPath = `public/cache/models/${filename}`;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    await fetch(`${baseUrl}/api/cache/miss`, {
      method: "POST",
      headers: { "Content-Type": "application/json", },
      body: JSON.stringify({
        furniture_id: obj.furnitures.furniture_id, 
        localPath,
      })
    });
    
    await cacheUtils.downloadFileFromS3ToLocal(obj.furnitures, localPath, filename, obj.furnitures.furniture_id);
  } catch (error) {
    console.log("Cache missing 로컬 파일 캐싱 실패 😨:", error);
  }
}