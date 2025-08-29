```javascript
function createObjectFromImage(position = [0, 0, 0], scale = 1) {
    const group = new THREE.Group();
    
    // 재질 정의
    const whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
    
    // 메인 원통 (외벽)
    const mainCylinderGeometry = new THREE.CylinderGeometry(1, 1, 3, 32);
    const mainCylinder = new THREE.Mesh(mainCylinderGeometry, whiteMaterial);
    mainCylinder.position.set(0, 1.5, 0);
    group.add(mainCylinder);
    
    // 상단 원형 덮개
    const topGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 32);
    const top = new THREE.Mesh(topGeometry, whiteMaterial);
    top.position.set(0, 3.05, 0);
    group.add(top);
    
    // 중간 선반
    const shelfGeometry = new THREE.CylinderGeometry(0.95, 0.95, 0.08, 32);
    const shelf = new THREE.Mesh(shelfGeometry, whiteMaterial);
    shelf.position.set(0, 1.8, 0);
    group.add(shelf);
    
    // 바닥 원형 베이스
    const bottomGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 32);
    const bottom = new THREE.Mesh(bottomGeometry, whiteMaterial);
    bottom.position.set(0, 0.05, 0);
    group.add(bottom);
    
    // 세로 홈 장식을 위한 작은 원통들
    for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const grooveGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 8);
        const groove = new THREE.Mesh(grooveGeometry, whiteMaterial);
        groove.position.set(
            Math.cos(angle) * 1.02,
            1.5,
            Math.sin(angle) * 1.02
        );
        group.add(groove);
    }
    
    // 전면 개구부를 위한 구멍 효과 (반원형 절단 느낌)
    const openingWidth = 1.2;
    const openingHeight = 1.8;
    const openingGeometry = new THREE.BoxGeometry(openingWidth, openingHeight, 0.3);
    const openingMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0 
    });
    const opening = new THREE.Mesh(openingGeometry, openingMaterial);
    opening.position.set(0.7, 1.5, 0);
    group.add(opening);
    
    group.position.set(...position);
    group.scale.setScalar(scale);
    return group;
}
```