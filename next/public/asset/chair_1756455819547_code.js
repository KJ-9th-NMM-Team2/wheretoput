```javascript
function createObjectFromImage(position = [0, 0, 0], scale = 1) {
    const group = new THREE.Group();
    
    // Materials
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0xD2A76B });
    const cushionMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    
    // Seat
    const seatGeometry = new THREE.BoxGeometry(1.6, 0.15, 1.5);
    const seat = new THREE.Mesh(seatGeometry, woodMaterial);
    seat.position.set(0, 1.5, 0);
    group.add(seat);
    
    // Seat cushion
    const cushionGeometry = new THREE.BoxGeometry(1.4, 0.1, 1.3);
    const cushion = new THREE.Mesh(cushionGeometry, cushionMaterial);
    cushion.position.set(0, 1.65, 0);
    group.add(cushion);
    
    // Front legs
    const frontLegGeometry = new THREE.BoxGeometry(0.12, 1.5, 0.12);
    const frontLeftLeg = new THREE.Mesh(frontLegGeometry, woodMaterial);
    frontLeftLeg.position.set(-0.65, 0.75, 0.6);
    group.add(frontLeftLeg);
    
    const frontRightLeg = new THREE.Mesh(frontLegGeometry, woodMaterial);
    frontRightLeg.position.set(0.65, 0.75, 0.6);
    group.add(frontRightLeg);
    
    // Back legs (part of backrest)
    const backLegGeometry = new THREE.BoxGeometry(0.12, 3.2, 0.12);
    const backLeftLeg = new THREE.Mesh(backLegGeometry, woodMaterial);
    backLeftLeg.position.set(-0.65, 1.6, -0.6);
    group.add(backLeftLeg);
    
    const backRightLeg = new THREE.Mesh(backLegGeometry, woodMaterial);
    backRightLeg.position.set(0.65, 1.6, -0.6);
    group.add(backRightLeg);
    
    // Top backrest rail with handle
    const topRailGeometry = new THREE.BoxGeometry(1.4, 0.25, 0.12);
    const topRail = new THREE.Mesh(topRailGeometry, woodMaterial);
    topRail.position.set(0, 3.0, -0.6);
    group.add(topRail);
    
    // Handle cutout simulation with smaller rail
    const handleGeometry = new THREE.BoxGeometry(0.4, 0.12, 0.12);
    const handle = new THREE.Mesh(handleGeometry, woodMaterial);
    handle.position.set(0, 2.7, -0.6);
    group.add(handle);
    
    // Horizontal slats
    const slatGeometry = new THREE.BoxGeometry(1.2, 0.08, 0.12);
    
    const slat1 = new THREE.Mesh(slatGeometry, woodMaterial);
    slat1.position.set(0, 2.3, -0.6);
    group.add(slat1);
    
    const slat2 = new THREE.Mesh(slatGeometry, woodMaterial);
    slat2.position.set(0, 2.0, -0.6);
    group.add(slat2);
    
    const slat3 = new THREE.Mesh(slatGeometry, woodMaterial);
    slat3.position.set(0, 1.7, -0.6);
    group.add(slat3);
    
    // Side supports
    const supportGeometry = new THREE.BoxGeometry(0.08, 0.08, 1.0);
    const leftSupport = new THREE.Mesh(supportGeometry, woodMaterial);
    leftSupport.position.set(-0.65, 1.0, 0);
    group.add(leftSupport);
    
    const rightSupport = new THREE.Mesh(supportGeometry, woodMaterial);
    rightSupport.position.set(0.65, 1.0, 0);
    group.add(rightSupport);
    
    // Cross support
    const crossSupportGeometry = new THREE.BoxGeometry(1.2, 0.08, 0.08);
    const crossSupport = new THREE.Mesh(crossSupportGeometry, woodMaterial);
    crossSupport.position.set(0, 1.0, 0.4);
    group.add(crossSupport);
    
    group.position.set(...position);
    group.scale.setScalar(scale);
    return group;
}
```