"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

enum Error {
  Configuration = "Configuration",
}

const errorMap = {
  [Error.Configuration]: (
    <p>
      인증 처리 중 문제가 발생했습니다. 이 오류가 지속될 경우 문의해 주세요.
      오류 코드:{" "}
      <code className="rounded-sm bg-amber-100 p-1 text-xs text-[#1c140d]">
        Configuration
      </code>
    </p>
  ),
};

export default function AuthErrorPage() {
  const search = useSearchParams();
  const error = search.get("error") as Error;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="flex h-screen w-full flex-col items-center justify-center px-4 overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(
          rgba(255, 255, 255, 0.95) 0%,
          rgba(255, 255, 255, 0.85) 100%
          ),
          url('/main_background.avif')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="block max-w-md w-full rounded-xl border border-amber-200 bg-white/90 backdrop-blur-sm p-8 text-center shadow-lg hover:bg-white/95 transition-colors">
        <div className="mb-4 text-6xl font-bold text-[#1c140d]/20">
          401
        </div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-[#1c140d]">
          문제가 발생했습니다
        </h1>
        <div className="font-normal text-[#1c140d]/80 leading-relaxed">
          {errorMap[error] || "이 오류가 지속될 경우 문의해 주세요."}
        </div>
        <div className="mt-6">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[#1c140d] text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
