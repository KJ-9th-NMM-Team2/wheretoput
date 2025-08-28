import React from 'react'
import { useRouter } from 'next/navigation'

export function RightSidebar() {
  const router = useRouter()

  const handleCreateFloorPlan = () => {
    router.push('/create')
  }

  return (
    <div style={{
      position: 'absolute',
      top: '0',
      right: '0',
      width: '60px',
      height: '100vh',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
      borderLeft: '1px solid #e9ecef',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '20px',
      gap: '15px'
    }}>
      {/* 도면 그리기 버튼 */}
      <button
        onClick={handleCreateFloorPlan}
        style={{
          width: '45px',
          height: '45px',
          background: 'linear-gradient(45deg, #2196F3, #1976D2)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.3)'
        }}
        title="도면 그리기"
      >
        📐
      </button>

      {/* 추가 버튼들을 위한 공간 */}
      <div style={{
        width: '45px',
        height: '1px',
        background: '#e9ecef',
        margin: '10px 0'
      }} />
      
      {/* 미래 확장을 위한 버튼 예시 */}
      <button
        style={{
          width: '45px',
          height: '45px',
          background: '#f8f9fa',
          color: '#666',
          border: '1px solid #e9ecef',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#e9ecef'
          e.target.style.color = '#333'
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#f8f9fa'
          e.target.style.color = '#666'
        }}
        title="설정"
      >
        ⚙️
      </button>
    </div>
  )
}