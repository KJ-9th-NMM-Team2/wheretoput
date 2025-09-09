import React from 'react'

export function HelpPopup() {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "20px",
        borderRadius: "10px",
        zIndex: 1000,
        textAlign: "center",
      }}
    >
      여기에 설명문구 작성...
    </div>
  )
}