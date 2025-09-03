```javascript
function createObjectFromImage(position = [0, 0, 0], scale = 1) {
    const group = new THREE.Group();
    
    // 재질 정의
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const backrestMaterial = new THREE.MeshLambertMaterial({ color: 0x383838 });
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    
    // 좌석 (둥근 모서리)
    const seatGeometry = new THREE.BoxGeometry(1.8, 0.15, 1.6);
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, 1.8, 0);
    group.add(seat);
    
    // 등받이 (둥근 형태)
    const backrestGeometry = new THREE.BoxGeometry(1.8, 1.2, 0.12);
    const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
    backrest.position.set(0, 2.5, -0.74);
    group.add(backrest);
    
    // 등받이와 좌석 연결부
    const connectionGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6);
    const connectionLeft = new THREE.Mesh(connectionGeometry, legMaterial);
    connectionLeft.position.set(-0.7, 2.1, -0.68);
    connectionLeft.rotation.x = Math.PI * 0.1;
    group.add(connectionLeft);
    
    const connectionRight = new THREE.Mesh(connectionGeometry, legMaterial);
    connectionRight.position.set(0.7, 2.1, -0.68);
    connectionRight.rotation.x = Math.PI * 0.1;
    group.add(connectionRight);
    
    // 다리 4개
    const legGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1.8);
    
    // 앞쪽 왼쪽 다리
    const legFrontLeft = new THREE.Mesh(legGeometry, legMaterial);
    legFrontLeft.position.set(-0.7, 0.9, 0.65);
    group.add(legFrontLeft);
    
    // 앞쪽 오른쪽 다리
    const legFrontRight = new THREE.Mesh(legGeometry, legMaterial);
    legFrontRight.position.set(0.7, 0.9, 0.65);
    group.add(legFrontRight);
    
    // 뒤쪽 왼쪽 다리
    const legBackLeft = new THREE.Mesh(legGeometry, legMaterial);
    legBackLeft.position.set(-0.7, 0.9, -0.65);
    group.add(legBackLeft);
    
    // 뒤쪽 오른쪽 다리
    const legBackRight = new THREE.Mesh(legGeometry, legMaterial);
    legBackRight.position.set(0.7, 0.9, -0.65);
    group.add(legBackRight);
    
    // 좌석 하부 보강재
    const supportGeometry = new THREE.BoxGeometry(1.6, 0.08, 0.08);
    const supportFront = new THREE.Mesh(supportGeometry, legMaterial);
    supportFront.position.set(0, 1.4, 0.65);
    group.add(supportFront);
    
    const supportBack = new THREE.Mesh(supportGeometry, legMaterial);
    supportBack.position.set(0, 1.4, -0.65);
    group.add(supportBack);
    
    const supportSideGeometry = new THREE.BoxGeometry(0.08, 0.08, 1.3);
    const supportLeft = new THREE.Mesh(supportSideGeometry, legMaterial);
    supportLeft.position.set(-0.7, 1.4, 0);
    group.add(supportLeft);
    
    const supportRight = new THREE.Mesh(supportSideGeometry, legMaterial);
    supportRight.position.set(0.7, 1.4, 0);
    group.add(supportRight);
    
    group.position.set(...position);
    group.scale.setScalar(scale);
    return group;
}
```