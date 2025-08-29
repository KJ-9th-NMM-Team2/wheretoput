import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    async session({ session, user }) {
      return {
        ...session,
      };
    },
  },
});

// import type { AuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import GitHubProvider from "next-auth/providers/github";

// // NextAuth 설정 객체를 정의
// export const authOptions: AuthOptions = {
//   // 환경 변수 사용헤 OAuth 제공자들을 등록.
//   providers: [
//     // Google OAuth 설정
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//     // GitHub OAuth 설정
//     GitHubProvider({
//       clientId: process.env.GITHUB_ID!,
//       clientSecret: process.env.GITHUB_SECRET!,
//     }),
//   ],
//   // 인증 과정 중 행되는 콜백 함수
//   callbacks: {
//     // JWT 토큰 생성 시 사용자 정보가 있으면, 토큰에 사용자 id를 추가
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//       }
//       return token;
//     },
//     // 세션 생성 시, 토큰의 사용자 id를 세션의 user 객체에 추가
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id;
//       }
//       return session;
//     },
//   },
//   // 인증 관련 페이지 경로
//   pages: {
//     signIn: "/login/signin", // 로그인 페이지
//     error: "/login/error", // 에러 발생 시 페이지
//   },
//   // 세션 저장 방식(JWT 사용)
//   session: {
//     strategy: "jwt",
//   },
//   // 개발 환경에서 디버그 모드 활성화
//   debug: process.env.NODE_ENV === "development",
// };
