import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// NextAuth의 타입을 확장하여 사용자 정보에 id 속성을 추가
declare module "next-auth" {
  // Session 객체의 user에 id 속성을 추가하고, 기본 user 속성도 포함
  interface Session {
    user: {
      id: string; // 사용자 고유 ID
    } & DefaultSession["user"]; // 기본 user 속성들(email, name 등)
  }

  // User 객체에도 id 속성을 추가
  interface User extends DefaultUser {
    id: string; // 사용자 고유 ID
  }
}

// JWT 토큰 타입에 id 속성을 추가
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string; // 사용자 고유 ID
  }
}
