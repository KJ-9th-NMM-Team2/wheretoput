```javascript
function createObjectFromImage(position = [0, 0, 0], scale = 1) {
    const group = new THREE.Group();
    
    // 재질 정의
    const drawerMaterial = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
    
    // 메인 프레임
    const frameGeometry = new THREE.BoxGeometry(4, 3, 1.8);
    const frame = new THREE.Mesh(frameGeometry, drawerMaterial);
    frame.position.set(0, 0, 0);
    group.add(frame);
    
    // 서랍들 (6개)
    const drawerWidth = 1.9;
    const drawerHeight = 0.45;
    const drawerDepth = 1.6;
    
    for(let row = 0; row < 3; row++) {
        for(let col = 0; col < 2; col++) {
            // 서랍 박스
            const drawerGeometry = new THREE.BoxGeometry(drawerWidth, drawerHeight, drawerDepth);
            const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial);
            
            const xPos = (col === 0) ? -0.95 : 0.95;
            const yPos = 0.9 - (row * 0.9);
            
            drawer.position.set(xPos, yPos, 0.1);
            group.add(drawer);
            
            // 서랍 손잡이
            const handleGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.8);
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.position.set(xPos + (col === 0 ? 0.95 : -0.95), yPos, 0.9);
            group.add(handle);
            
            // 서랍 전면 패널
            const frontGeometry = new THREE.BoxGeometry(drawerWidth, drawerHeight, 0.05);
            const front = new THREE.Mesh(frontGeometry, drawerMaterial);
            front.position.set(xPos, yPos, 0.9);
            group.add(front);
        }
    }
    
    // 상판
    const topGeometry = new THREE.BoxGeometry(4.2, 0.1, 1.9);
    const top = new THREE.Mesh(topGeometry, drawerMaterial);
    top.position.set(0, 1.55, 0);
    group.add(top);
    
    // 바닥판
    const bottomGeometry = new THREE.BoxGeometry(4.2, 0.1, 1.9);
    const bottom = new THREE.Mesh(bottomGeometry, drawerMaterial);
    bottom.position.set(0, -1.55, 0);
    group.add(bottom);
    
    // 측면 패널들
    const sideGeometry = new THREE.BoxGeometry(0.1, 3, 1.9);
    const leftSide = new THREE.Mesh(sideGeometry, drawerMaterial);
    leftSide.position.set(-2.05, 0, 0);
    group.add(leftSide);
    
    const rightSide = new THREE.Mesh(sideGeometry, drawerMaterial);
    rightSide.position.set(2.05, 0, 0);
    group.add(rightSide);
    
    // 중앙 구분판
    const dividerGeometry = new THREE.BoxGeometry(0.05, 3, 1.9);
    const divider = new THREE.Mesh(dividerGeometry, drawerMaterial);
    divider.position.set(0, 0, 0);
    group.add(divider);
    
    group.position.set(...position);
    group.scale.setScalar(scale);
    
    return group;
}
```