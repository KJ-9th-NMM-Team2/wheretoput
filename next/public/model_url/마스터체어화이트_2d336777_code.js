```javascript
function createObjectFromImage(position = [0, 0, 0], scale = 1) {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({ color: 0xf0f0f0 });
    
    // 의자 시트
    const seatGeometry = new THREE.BoxGeometry(0.45, 0.03, 0.4);
    const seat = new THREE.Mesh(seatGeometry, material);
    seat.position.set(0, 0.42, 0);
    group.add(seat);
    
    // 앞다리 2개
    const frontLegGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.42, 16);
    const frontLeftLeg = new THREE.Mesh(frontLegGeometry, material);
    frontLeftLeg.position.set(-0.18, 0.21, 0.15);
    group.add(frontLeftLeg);
    
    const frontRightLeg = new THREE.Mesh(frontLegGeometry, material);
    frontRightLeg.position.set(0.18, 0.21, 0.15);
    group.add(frontRightLeg);
    
    // 뒷다리 2개
    const backLegGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.75, 16);
    const backLeftLeg = new THREE.Mesh(backLegGeometry, material);
    backLeftLeg.position.set(-0.18, 0.375, -0.15);
    group.add(backLeftLeg);
    
    const backRightLeg = new THREE.Mesh(backLegGeometry, material);
    backRightLeg.position.set(0.18, 0.375, -0.15);
    group.add(backRightLeg);
    
    // 곡선 등받이 프레임 - 왼쪽
    const backFrameCurve1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.18, 0.45, -0.15),
        new THREE.Vector3(-0.25, 0.55, -0.1),
        new THREE.Vector3(-0.22, 0.65, 0),
        new THREE.Vector3(-0.15, 0.7, 0.1),
        new THREE.Vector3(0, 0.72, 0.15)
    ]);
    const backFrame1Geometry = new THREE.TubeGeometry(backFrameCurve1, 20, 0.012, 8, false);
    const backFrame1 = new THREE.Mesh(backFrame1Geometry, material);
    group.add(backFrame1);
    
    // 곡선 등받이 프레임 - 오른쪽
    const backFrameCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.18, 0.45, -0.15),
        new THREE.Vector3(0.25, 0.55, -0.1),
        new THREE.Vector3(0.22, 0.65, 0),
        new THREE.Vector3(0.15, 0.7, 0.1),
        new THREE.Vector3(0, 0.72, 0.15)
    ]);
    const backFrame2Geometry = new THREE.TubeGeometry(backFrameCurve2, 20, 0.012, 8, false);
    const backFrame2 = new THREE.Mesh(backFrame2Geometry, material);
    group.add(backFrame2);
    
    // 추가 장식 곡선들
    const decorCurve1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.12, 0.5, -0.1),
        new THREE.Vector3(-0.08, 0.58, 0),
        new THREE.Vector3(-0.04, 0.62, 0.08)
    ]);
    const decorFrame1Geometry = new THREE.TubeGeometry(decorCurve1, 15, 0.01, 8, false);
    const decorFrame1 = new THREE.Mesh(decorFrame1Geometry, material);
    group.add(decorFrame1);
    
    const decorCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.12, 0.5, -0.1),
        new THREE.Vector3(0.08, 0.58, 0),
        new THREE.Vector3(0.04, 0.62, 0.08)
    ]);
    const decorFrame2Geometry = new THREE.TubeGeometry(decorCurve2, 15, 0.01, 8, false);
    const decorFrame2 = new THREE.Mesh(decorFrame2Geometry, material);
    group.add(decorFrame2);
    
    // 상단 연결 곡선
    const topCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.08, 0.68, 0.05),
        new THREE.Vector3(0, 0.7, 0.1),
        new THREE.Vector3(0.08, 0.68, 0.05)
    ]);
    const topFrameGeometry = new THREE.TubeGeometry(topCurve, 15, 0.01, 8, false);
    const topFrame = new THREE.Mesh(topFrameGeometry, material);
    group.add(topFrame);
    
    group.position.set(...position);
    group.scale.setScalar(scale);
    return group;
}
```