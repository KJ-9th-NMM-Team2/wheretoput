// draw and drop 사용 시 canvas에 옵션으로 밑 2줄 추가
// onDragOver={(e) => e.preventDefault()}
// onDrop={(e) => FurnitureDrop(e, addModel)}

export default function FurnitureDrop(e: React.DragEvent<HTMLDivElement>, addModel: any) {
    e.preventDefault();
    const furnitureData = JSON.parse(e.dataTransfer.getData("application/json"));

    // 마우스 위치를 3D 좌표로 변환
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1 - 1;
    const z = -((e.clientY - rect.top) / rect.height) * 1 + 1;

    // 가구를 3D 씬에 추가
    const newModel = {
        furniture_id: furnitureData.furniture_id, // 중요: furniture_id 추가
        url: '/legacy_mesh (1).glb', // 테스트용 나중에 furnitureData.model_url 수정
        name: furnitureData.name,
        length_x: furnitureData.length_x,
        length_y: furnitureData.length_y,
        length_z: furnitureData.length_z,
        price: furnitureData.price,
        brand: furnitureData.brand,
        isCityKit: false,
        texturePath: null,
        position: [x * 10, 0, z * 10] // 마우스 위치 전달
    };

    // store에 모델 추가
    addModel(newModel);
    console.log('Dropped furniture:', furnitureData, 'at position:', newModel.position);
}