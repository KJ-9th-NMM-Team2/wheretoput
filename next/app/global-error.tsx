"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html className="overflow-hidden">
      <body className="overflow-hidden">
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
            <div className="mb-4 text-6xl font-bold text-[#1c140d]/20">
              500
            </div>
            <h1 className="mb-4 text-2xl font-bold tracking-tight text-[#1c140d]">
              문제가 발생했습니다
            </h1>
            <div className="font-normal text-[#1c140d]/80 leading-relaxed mb-6">
              페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 bg-[#1c140d] text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                다시 시도
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-3 border border-[#1c140d] text-[#1c140d] font-semibold rounded-lg hover:bg-[#1c140d] hover:text-white transition-colors cursor-pointer"
              >
                홈으로 이동
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
