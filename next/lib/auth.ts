import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/lib/prisma";

const providers: Provider[] = [Google, GitHub];

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  })
  .filter((provider) => provider.id !== "credentials");

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, GitHub],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 로그인 후 메인페이지로 리다이렉트
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        // For privacy protection, use email prefix for Google OAuth users
        let displayName = user.name;
        if (account?.provider === "google" && user.email) {
          // Extract email prefix (part before @) for Google users
          displayName = user.email.split('@')[0];
        }
        
        await prisma.User.upsert({
          where: { email: user.email! },
          update: {
            name: displayName,
            image: user.image,
          },
          create: {
            email: user.email!,
            name: displayName,
            image: user.image,
          },
        });
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // console.log("token:", token);
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        const userInfo = await prisma.User.findUnique({
          where: { email: user.email! },
        });
        token.id = userInfo?.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
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
