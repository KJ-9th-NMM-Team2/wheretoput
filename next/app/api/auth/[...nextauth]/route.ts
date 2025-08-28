// import NextAuth from "next-auth"; // NextAuth 함수(인증 핸들러)
// import { authOptions } from "@/lib/auth"; // 인증 옵션 객체

// // NextAuth에 인증 옵션을 전달하여 인증 핸들러 생성
// const handler = NextAuth(authOptions);

import { handlers } from "@/lib/auth";
// GET, POST 요청에 대해 인증 핸들러를 내보냄
export const { GET, POST } = handlers;
