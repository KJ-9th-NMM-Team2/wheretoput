```javascript
function createObjectFromImage(position = [0, 0, 0], scale = 1) {
    const group = new THREE.Group();
    
    // 재질 정의
    const darkGrayMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const mediumGrayMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    
    // 책상 상판
    const deskTopGeometry = new THREE.BoxGeometry(3, 0.15, 1.5);
    const deskTop = new THREE.Mesh(deskTopGeometry, mediumGrayMaterial);
    deskTop.position.set(0, 1.4, 0);
    group.add(deskTop);
    
    // 좌측 서랍 유닛 (메인 몸체)
    const leftUnitGeometry = new THREE.BoxGeometry(1.2, 1.3, 1.4);
    const leftUnit = new THREE.Mesh(leftUnitGeometry, darkGrayMaterial);
    leftUnit.position.set(-0.9, 0.75, 0);
    group.add(leftUnit);
    
    // 좌측 서랍 손잡이
    const handleGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.05);
    const handle1 = new THREE.Mesh(handleGeometry, mediumGrayMaterial);
    handle1.position.set(-0.9, 1.1, 0.75);
    group.add(handle1);
    
    const handle2 = new THREE.Mesh(handleGeometry, mediumGrayMaterial);
    handle2.position.set(-0.9, 0.7, 0.75);
    group.add(handle2);
    
    const handle3 = new THREE.Mesh(handleGeometry, mediumGrayMaterial);
    handle3.position.set(-0.9, 0.3, 0.75);
    group.add(handle3);
    
    // 우측 다리
    const rightLegGeometry = new THREE.BoxGeometry(0.15, 1.4, 1.4);
    const rightLeg = new THREE.Mesh(rightLegGeometry, darkGrayMaterial);
    rightLeg.position.set(1.2, 0.7, 0);
    group.add(rightLeg);
    
    // 의자 좌석
    const seatGeometry = new THREE.BoxGeometry(1.8, 0.12, 1.2);
    const seat = new THREE.Mesh(seatGeometry, darkGrayMaterial);
    seat.position.set(0, 0.5, -2.2);
    group.add(seat);
    
    // 의자 등받이
    const backrestGeometry = new THREE.BoxGeometry(1.8, 0.8, 0.12);
    const backrest = new THREE.Mesh(backrestGeometry, darkGrayMaterial);
    backrest.position.set(0, 0.9, -2.8);
    group.add(backrest);
    
    // 의자 다리들
    const chairLegGeometry = new THREE.BoxGeometry(0.08, 0.5, 0.08);
    
    const chairLeg1 = new THREE.Mesh(chairLegGeometry, darkGrayMaterial);
    chairLeg1.position.set(-0.8, 0.25, -1.6);
    group.add(chairLeg1);
    
    const chairLeg2 = new THREE.Mesh(chairLegGeometry, darkGrayMaterial);
    chairLeg2.position.set(0.8, 0.25, -1.6);
    group.add(chairLeg2);
    
    const chairLeg3 = new THREE.Mesh(chairLegGeometry, darkGrayMaterial);
    chairLeg3.position.set(-0.8, 0.25, -2.8);
    group.add(chairLeg3);
    
    const chairLeg4 = new THREE.Mesh(chairLegGeometry, darkGrayMaterial);
    chairLeg4.position.set(0.8, 0.25, -2.8);
    group.add(chairLeg4);
    
    // 의자와 등받이 연결부
    const connectionGeometry = new THREE.BoxGeometry(0.08, 0.4, 0.08);
    const connection1 = new THREE.Mesh(connectionGeometry, darkGrayMaterial);
    connection1.position.set(-0.8, 0.7, -2.8);
    group.add(connection1);
    
    const connection2 = new THREE.Mesh(connectionGeometry, darkGrayMaterial);
    connection2.position.set(0.8, 0.7, -2.8);
    group.add(connection2);
    
    group.position.set(...position);
    group.scale.setScalar(scale);
    return group;
}
```