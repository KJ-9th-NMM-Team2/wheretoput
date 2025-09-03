"use client"; // 클라이언트 컴포넌트임을 명시

import { SessionProvider } from "next-auth/react"; // 인증 세션 컨텍스트 제공 컴포넌트
import { ReactNode } from "react"; // ReactNode 타입 임포트

// AuthProvider 컴포넌트의 props 타입 정의 (children을 받음)
interface AuthProviderProps {
  children: ReactNode;
}

// 인증 세션을 하위 컴포넌트에 제공하는 AuthProvider 컴포넌트
export default function AuthProvider({ children }: AuthProviderProps) {
  // 하위 컴포넌트를 SessionProvider로 감싸 인증 정보 전달
  return <SessionProvider>{children}</SessionProvider>;
}
