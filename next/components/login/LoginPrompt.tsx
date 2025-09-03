"use client";
import { signIn } from "next-auth/react";

interface LoginPromptProps {
  message?: string;
  redirectTo?: string;
}

export default function LoginPrompt({
  message = "로그인이 필요합니다",
  redirectTo,
}: LoginPromptProps) {
  const handleSignIn = () => {
    signIn(undefined, {
      callbackUrl: redirectTo || window.location.href,
    });
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-5 bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/20 max-w-md border border-amber-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {message}
        </h1>
        <p className="text-base mb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
          먼저 로그인해 주세요.
        </p>
        <button
          onClick={handleSignIn}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-none rounded-lg text-base font-bold cursor-pointer transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          로그인하기
        </button>
      </div>
    </div>
  );
}
