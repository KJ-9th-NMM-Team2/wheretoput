// 채팅 연결 관리 훅
// 토큰 교환, 소켓 연결, 연결 상태 관리를 담당

import { useState, useEffect } from "react";
import { setAuthToken } from "@/lib/client/api";
import { connectSocket, getSocket } from "@/lib/client/socket";

export const useChatConnection = (open: boolean) => {
  const [token, setToken] = useState<string | null>(null);

  // 토큰 교환 + 소켓 준비
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        // 1. 토큰을 받아오는 작업
        const r = await fetch("/api/chat/token", { cache: "no-store" });
        // 2. response 응답 체크
        if (!r.ok) {
          console.error("token status", r.status);
          return;
        }
        // 여기서 바로 json() 호출하고 다시는 호출하지 않기
        const data = await r.json();
        console.log("Token API response:", data);
        // 토큰 값 가져오기
        const token = data?.tokenData?.jti;
        if (!alive || !token) return;
        setToken(token);
        setAuthToken(token);
        connectSocket(token);
      } catch (e) {
        console.error("token error", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  // 초기 토큰 부트스트랩
  useEffect(() => {
    const bootstrap = async () => {
      const res = await fetch("/api/chat/token", { cache: "no-store" });
      const data = await res.json();
      console.log("토큰 응답:", data);
      const token = data["tokenData"]?.["jti"] || data.token;
      console.log("추출된 토큰:", token);
      setToken(token);
      setAuthToken(token);
      // 이후부터 api.get/post가 자동으로 Authorization 포함
    };
    bootstrap();
  }, []);

  // 팝업 닫힐 때 소켓 정리
  useEffect(() => {
    if (open) return;
    const s = getSocket();
    if (s) s.disconnect();
  }, [open]);

  return { token };
};