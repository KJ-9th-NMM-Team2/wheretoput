import { useState, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { on } from 'events'

export function useObjectControls(modelId, onPositionChange, onRotationChange, onScaleChange, onSelect, onHover, controlsRef) {
  const { camera, gl, raycaster, mouse } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const [isScaling, setIsScaling] = useState(false)
  const [dragOffset, setDragOffset] = useState(new THREE.Vector3())
  const [initialMouseY, setInitialMouseY] = useState(0)
  const [initialScale, setInitialScale] = useState(1)

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation()
    onSelect(modelId)
    
    if (controlsRef.current) {
      controlsRef.current.enabled = false
    }
    
    if (e.shiftKey) {
      // Shift + 클릭으로 크기 조정 모드
      setIsScaling(true)
      setInitialMouseY(e.clientY)
      setInitialScale(e.currentTarget.scale || 1)
      gl.domElement.style.cursor = 'ns-resize'
    } else {
      // 일반 클릭으로 이동 모드
      setIsDragging(true)
      
      const rect = gl.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      
      raycaster.setFromCamera(mouse, camera)
      
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(floorPlane, intersectPoint)
      
      if (intersectPoint && e.currentTarget && e.currentTarget.position) {
        setDragOffset(intersectPoint.clone().sub(e.currentTarget.position))
      }
      
      gl.domElement.style.cursor = 'grabbing'
    }
  }, [modelId, onSelect, camera, gl, raycaster, mouse, controlsRef])

  const handlePointerMove = useCallback((e) => {
    if (isDragging) {
      const rect = gl.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      
      raycaster.setFromCamera(mouse, camera)
      
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(floorPlane, intersectPoint)
      
      if (intersectPoint) {
        const newPosition = intersectPoint.clone().sub(dragOffset)
        onPositionChange(modelId, [newPosition.x, newPosition.y, newPosition.z])
      }
    } else if (isScaling) {
      const deltaY = (initialMouseY - e.clientY) * 0.01
      const newScale = Math.max(0.1, Math.min(5, initialScale + deltaY))
      onScaleChange(modelId, newScale)
    }
  }, [isDragging, isScaling, initialMouseY, initialScale, modelId, onPositionChange, onScaleChange, camera, gl, raycaster, mouse, dragOffset])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setIsScaling(false)
    gl.domElement.style.cursor = 'auto'
    
    if (controlsRef.current) {
      controlsRef.current.enabled = true
    }
  }, [gl, controlsRef])

  const handlePointerOver = useCallback(() => {
    onHover(modelId)

    if (!isDragging && !isScaling) {
      gl.domElement.style.cursor = 'pointer'
    }
  }, [modelId, gl, isDragging, isScaling, onHover])

  const handlePointerOut = useCallback(() => {
    onHover(null)

    if (!isDragging && !isScaling) {
      gl.domElement.style.cursor = 'auto'
    }
  }, [gl, isDragging, isScaling, onHover])

  return {
    isDragging,
    isScaling,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerOver,
    handlePointerOut
  }
}