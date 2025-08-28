import React, { useRef, useState } from 'react'
import { useStore } from '../store/useStore.js'

export function FurnitureLibrary() {
  const furnitureImportRef = useRef()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { addModel } = useStore()

  // 미리 정의된 가구 목록
  const predefinedFurniture = [
    { id: 1, name: '의자', path: '/asset/chair.glb', category: '좌석' },
    { id: 2, name: '소파', path: '/asset/소파.glb', category: '좌석' },
    { id: 3, name: '냉장고장', path: '/asset/냉장고장.glb', category: '주방' },
    { id: 4, name: '수납장', path: '/asset/수납장.glb', category: '수납' },
    { id: 5, name: '우드 수납장', path: '/asset/우드 수납장.glb', category: '수납' },
    { id: 6, name: '워시타워', path: '/asset/워시타워.glb', category: '세탁' },
    { id: 7, name: '팬트리', path: '/asset/팬트리.glb', category: '수납' }
  ]

  // 카테고리별 가구 그룹화
  const categories = {}
  predefinedFurniture.forEach(furniture => {
    if (!categories[furniture.category]) {
      categories[furniture.category] = []
    }
    categories[furniture.category].push(furniture)
  })

  // 미리 정의된 가구 추가
  const addPredefinedFurniture = (furniture) => {
    const newModel = {
      url: furniture.path,
      name: furniture.name,
      isCityKit: false,
      texturePath: null
    }
    addModel(newModel)
  }

  // 가구 이미지 임포트 처리
  const handleFurnitureImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일을 선택해주세요.')
      return
    }

    // 로딩 상태 표시
    const loadingAlert = document.createElement('div')
    loadingAlert.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 30px;
      border-radius: 15px;
      z-index: 10000;
      text-align: center;
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `
    loadingAlert.innerHTML = `
      <div style="margin-bottom: 15px;">🔄</div>
      <div>이미지를 3D 모델로 변환하는 중...</div>
      <div style="font-size: 14px; opacity: 0.8; margin-top: 10px;">잠시만 기다려주세요.</div>
    `
    document.body.appendChild(loadingAlert)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/furniture-import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        const newModel = {
          url: result.glbPath,
          name: `임포트된 가구 (${result.filename})`,
          isCityKit: false,
          texturePath: null
        }
        addModel(newModel)
        
        alert('🎉 가구 임포트가 완료되었습니다!\n3D 모델이 생성되어 씬에 추가되었습니다.')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('가구 임포트 오류:', error)
      alert('❌ 가구 임포트에 실패했습니다:\n' + error.message)
    } finally {
      document.body.removeChild(loadingAlert)
      event.target.value = ''
    }
  }

  return (
    <div style={{
      position: 'absolute',
      top: '0',
      left: '0',
      width: isCollapsed ? '50px' : '280px',
      height: '100vh',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
      borderRight: '1px solid #e9ecef',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
      zIndex: 100,
      transition: 'width 0.3s ease',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #e9ecef',
        background: '#ffffff',
        position: 'sticky',
        top: '0',
        zIndex: 101
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {!isCollapsed && (
            <h3 style={{
              margin: '0',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              🪑 가구 라이브러리
            </h3>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '3px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* 가구 임포트 섹션 */}
          <div style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
            <button
              onClick={() => furnitureImportRef.current?.click()}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)'
              }}
            >
              📷 가구 임포트
              <div style={{ fontSize: '11px', opacity: '0.9', marginTop: '2px' }}>
                이미지 → 3D 모델
              </div>
            </button>
            <input
              ref={furnitureImportRef}
              type="file"
              accept="image/*"
              onChange={handleFurnitureImport}
              style={{ display: 'none' }}
            />
          </div>

          {/* 카테고리별 가구 목록 */}
          <div style={{ padding: '15px' }}>
            {Object.entries(categories).map(([category, furnitureList]) => (
              <div key={category} style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontSize: '13px',
                  color: '#666',
                  margin: '0 0 10px 0',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {category}
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  {furnitureList.map((furniture) => (
                    <button
                      key={furniture.id}
                      onClick={() => addPredefinedFurniture(furniture)}
                      style={{
                        padding: '10px 8px',
                        background: '#ffffff',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        fontWeight: '500',
                        color: '#333'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f8f9fa'
                        e.target.style.borderColor = '#4CAF50'
                        e.target.style.transform = 'translateY(-1px)'
                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#ffffff'
                        e.target.style.borderColor = '#e9ecef'
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      {furniture.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}