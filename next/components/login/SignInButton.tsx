"use client";
import { signIn } from "next-auth/react";

export default function SignInButton() {
  return <button onClick={() => signIn()}>로그인</button>;
}
