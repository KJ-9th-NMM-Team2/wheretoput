```javascript
function createObjectFromImage(position = [0, 0, 0], scale = 1) {
    const group = new THREE.Group();
    
    // 재질 정의
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0xB8956A });
    const fabricMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7B6B });
    
    // 나무 프레임 - 왼쪽 다리
    const leftLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 1.2, 0.8),
        woodMaterial
    );
    leftLeg.position.set(-1.2, 0, 0);
    group.add(leftLeg);
    
    // 나무 프레임 - 오른쪽 다리
    const rightLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 1.2, 0.8),
        woodMaterial
    );
    rightLeg.position.set(1.2, 0, 0);
    group.add(rightLeg);
    
    // 뒤쪽 프레임 연결부
    const backFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 0.15, 0.15),
        woodMaterial
    );
    backFrame.position.set(0, 0.4, -0.325);
    group.add(backFrame);
    
    // 앞쪽 하단 프레임
    const frontBottomFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 0.15, 0.15),
        woodMaterial
    );
    frontBottomFrame.position.set(0, -0.4, 0.325);
    group.add(frontBottomFrame);
    
    // 쿠션 프레임 (좌석)
    const seatFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.2, 0.7),
        fabricMaterial
    );
    seatFrame.position.set(0, -0.3, 0);
    group.add(seatFrame);
    
    // 쿠션 (좌석 상부)
    const seatCushion = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.25, 0.65),
        fabricMaterial
    );
    seatCushion.position.set(0, -0.125, 0);
    group.add(seatCushion);
    
    // 등받이 쿠션 - 왼쪽
    const leftBackCushion = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.8, 0.25),
        fabricMaterial
    );
    leftBackCushion.position.set(-0.525, 0.2, -0.225);
    group.add(leftBackCushion);
    
    // 등받이 쿠션 - 오른쪽
    const rightBackCushion = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.8, 0.25),
        fabricMaterial
    );
    rightBackCushion.position.set(0.525, 0.2, -0.225);
    group.add(rightBackCushion);
    
    // 팔걸이 - 왼쪽
    const leftArmrest = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.15, 0.6),
        fabricMaterial
    );
    leftArmrest.position.set(-0.975, 0.15, 0.05);
    group.add(leftArmrest);
    
    // 팔걸이 - 오른쪽
    const rightArmrest = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.15, 0.6),
        fabricMaterial
    );
    rightArmrest.position.set(0.975, 0.15, 0.05);
    group.add(rightArmrest);
    
    group.position.set(...position);
    group.scale.setScalar(scale);
    return group;
}
```