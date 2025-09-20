"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function NotFound() {
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
      <div className="block max-w-md w-full rounded-xl border border-amber-200 bg-white/90 backdrop-blur-sm p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl font-bold text-[#1c140d]/20">404</div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-[#1c140d]">
          페이지를 찾을 수 없습니다
        </h1>
        <div className="font-normal text-[#1c140d]/80 leading-relaxed mb-6">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#1c140d] text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            홈으로 돌아가기
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-[#1c140d] text-[#1c140d] font-semibold rounded-lg hover:bg-[#1c140d] hover:text-white transition-colors cursor-pointer"
          >
            이전 페이지로
          </button>
        </div>
      </div>
    </div>
  );
}
