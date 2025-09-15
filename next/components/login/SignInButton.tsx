"use client";
import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn()}
      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors tracking-wider"
    >
      로그인
    </button>
  );
}
