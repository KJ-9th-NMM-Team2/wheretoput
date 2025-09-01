'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

// /create와 /sim 경로에서 Header를 숨기는 조건부 Header 컴포넌트
export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Header를 숨길 경로들
  const hideHeaderPaths = ['/create', '/sim'];
  
  // 현재 경로가 숨김 경로와 일치하거나 하위 경로인지 확인
  const shouldHideHeader = hideHeaderPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
  
  // Header를 숨겨야 하는 경우 null 반환
  if (shouldHideHeader) {
    return null;
  }
  
  // 그 외의 경우 Header 렌더링
  return <Header />;
}