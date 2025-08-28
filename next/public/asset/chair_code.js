```javascript
function createObjectFromImage(position = [0, 0, 0], scale = 1) {
    const group = new THREE.Group();
    
    // 재질 정의
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
    const cushionMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
    
    // 뒷다리 (2개)
    const backLegGeometry = new THREE.BoxGeometry(0.08, 1.6, 0.08);
    const backLegLeft = new THREE.Mesh(backLegGeometry, woodMaterial);
    backLegLeft.position.set(-0.35, 0.8, -0.35);
    group.add(backLegLeft);
    
    const backLegRight = new THREE.Mesh(backLegGeometry, woodMaterial);
    backLegRight.position.set(0.35, 0.8, -0.35);
    group.add(backLegRight);
    
    // 앞다리 (2개)
    const frontLegGeometry = new THREE.BoxGeometry(0.08, 0.9, 0.08);
    const frontLegLeft = new THREE.Mesh(frontLegGeometry, woodMaterial);
    frontLegLeft.position.set(-0.35, 0.45, 0.35);
    group.add(frontLegLeft);
    
    const frontLegRight = new THREE.Mesh(frontLegGeometry, woodMaterial);
    frontLegRight.position.set(0.35, 0.45, 0.35);
    group.add(frontLegRight);
    
    // 등받이 상단
    const backTopGeometry = new THREE.BoxGeometry(0.8, 0.12, 0.05);
    const backTop = new THREE.Mesh(backTopGeometry, woodMaterial);
    backTop.position.set(0, 1.55, -0.35);
    group.add(backTop);
    
    // 등받이 슬랫들
    for (let i = 0; i < 4; i++) {
        const slatGeometry = new THREE.BoxGeometry(0.7, 0.08, 0.04);
        const slat = new THREE.Mesh(slatGeometry, woodMaterial);
        slat.position.set(0, 1.35 - i * 0.15, -0.35);
        group.add(slat);
    }
    
    // 등받이 손잡이 구멍
    const handleGeometry = new THREE.RingGeometry(0.06, 0.12, 16);
    const handle = new THREE.Mesh(handleGeometry, woodMaterial);
    handle.position.set(0, 1.55, -0.32);
    handle.rotation.x = Math.PI / 2;
    group.add(handle);
    
    // 좌석 프레임
    const seatFrameGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.8);
    const seatFrame = new THREE.Mesh(seatFrameGeometry, woodMaterial);
    seatFrame.position.set(0, 0.9, 0);
    group.add(seatFrame);
    
    // 쿠션
    const cushionGeometry = new THREE.BoxGeometry(0.75, 0.08, 0.75);
    const cushion = new THREE.Mesh(cushionGeometry, cushionMaterial);
    cushion.position.set(0, 0.94, 0);
    group.add(cushion);
    
    // 측면 지지대
    const sideSupport1Geometry = new THREE.BoxGeometry(0.05, 0.05, 0.6);
    const sideSupport1 = new THREE.Mesh(sideSupport1Geometry, woodMaterial);
    sideSupport1.position.set(-0.35, 0.3, 0);
    group.add(sideSupport1);
    
    const sideSupport2 = new THREE.Mesh(sideSupport1Geometry, woodMaterial);
    sideSupport2.position.set(0.35, 0.3, 0);
    group.add(sideSupport2);
    
    // 전면 지지대
    const frontSupportGeometry = new THREE.BoxGeometry(0.6, 0.05, 0.05);
    const frontSupport = new THREE.Mesh(frontSupportGeometry, woodMaterial);
    frontSupport.position.set(0, 0.3, 0.35);
    group.add(frontSupport);
    
    group.position.set(...position);
    group.scale.setScalar(scale);
    return group;
}
```