// 가구 클릭 시 프리뷰 모드 시작
export function startFurniturePreview(
  furnitureData: any,
  startPreviewMode: any
) {
  const newModel = {
    furniture_id: furnitureData.furniture_id,
    url: "/legacy_mesh (1).glb", // 테스트용 나중에 furnitureData.model_url 수정
    name: furnitureData.name,
    length_x: furnitureData.length_x,
    length_y: furnitureData.length_y,
    length_z: furnitureData.length_z,
    price: furnitureData.price,
    brand: furnitureData.brand,
    isCityKit: false,
    texturePath: null,
  };

  startPreviewMode(newModel);
}

// 레거시 드래그앤드롭 (기존 코드와 호환성 유지)
export default function FurnitureDrop(
  e: React.DragEvent<HTMLDivElement>,
  addModel: any,
  startPreviewMode?: any
) {
  e.preventDefault();
  const furnitureData = JSON.parse(e.dataTransfer.getData("application/json"));

  // 프리뷰 모드가 사용 가능하면 프리뷰 모드로, 아니면 기존 방식으로
  if (startPreviewMode) {
    startFurniturePreview(furnitureData, startPreviewMode);
    return;
  }

  // 기존 드래그앤드롭 로직 (하위 호환성)
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 1 - 1;
  const z = -((e.clientY - rect.top) / rect.height) * 1 + 1;

  const newModel = {
    furniture_id: furnitureData.furniture_id,
    url: "/legacy_mesh (1).glb",
    name: furnitureData.name,
    length_x: furnitureData.length_x,
    length_y: furnitureData.length_y,
    length_z: furnitureData.length_z,
    price: furnitureData.price,
    brand: furnitureData.brand,
    isCityKit: false,
    texturePath: null,
    position: [x * 10, 0, z * 10],
  };

  addModel(newModel);
  console.log(
    "Dropped furniture:",
    furnitureData,
    "at position:",
    newModel.position
  );
}
