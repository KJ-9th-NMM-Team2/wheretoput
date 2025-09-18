"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import SignInButton from "@/components/login/SignInButton";
import UserBubble from "@/components/login/UserBubble";
import { useSession } from "next-auth/react";
// import { Handler } from '@/lib/handler';
// 로그인되어 있으면 로그아웃, 로그아웃되어 있으면 로그인 버튼
export function SignInCheck() {
  const { data: session, status } = useSession();
  if (status === "loading") return <div className="w-10 h-10"></div>;
  if (!session?.user) return <SignInButton />;
  if (session?.user?.name && session?.user?.id && session?.user?.image) {
    return (
      <UserBubble
        name={session.user.name}
        user_id={session.user.id}
        image={session.user.image}
      />
    );
  } else return <SignInButton />;
}

export default function Header() {
  const [searchInput, setSearchInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // page 이동 시 검색어 Reset
  useEffect(() => {
    if (!pathname.startsWith("/search")) {
      setSearchInput("");
    }
  }, [pathname]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isComposing) {
      searchInput
        ? router.push(`/search?order=view&q=${encodeURIComponent(searchInput)}`)
        : router.push("/search");
      setSearchInput("");
    }
  };

  return (
    <header
      className="
        flex items-center justify-between whitespace-nowrap border-b border-solid transition-all duration-200
        border-amber-100 bg-white/95 backdrop-blur-sm shadow-sm
        dark:border-gray-700 dark:bg-gray-900 dark:shadow-lg
        sticky top-0 z-50
        px-3 sm:px-6 lg:px-8
        py-3 sm:py-4
      "
    >
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/">
            <img
              src="/asset/wheretoput.png"
              alt="WheretoPut"
              className="w-8 h-8 sm:w-12 sm:h-12 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>

          <Link href="/">
            <h2 className="text-lg sm:text-2xl font-bold leading-tight tracking-tight text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 cursor-pointer">
              어따놀래
            </h2>
          </Link>
        </div>

        <nav className="flex items-center gap-4 lg:gap-8 flex-1 md:flex-none">
          {/* 모바일에서는 집들이만 표시 - 오른쪽 정렬 */}
          <div className="md:hidden flex-1 flex justify-end">
            <Link
              href="/search"
              className="
                text-sm font-bold leading-normal px-4 py-2 rounded-md transition-all duration-200
                hover:scale-105 active:scale-95
                text-black hover:text-gray-600 hover:bg-gray-100
                dark:text-white dark:hover:text-gray-300 dark:hover:bg-gray-700
              "
            >
              집들이
            </Link>
          </div>

          {/* 데스크탑에서는 빌드와 집들이 모두 표시 */}
          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            <Link
              href="/create"
              rel="noopener noreferrer"
              className="
                text-base lg:text-lg font-bold leading-normal px-2 lg:px-3 py-2 rounded-md transition-all duration-200
                hover:scale-105 active:scale-95
                text-black hover:text-gray-600 hover:bg-gray-100
                dark:text-white dark:hover:text-gray-300 dark:hover:bg-gray-700
              "
            >
              빌드
            </Link>

            <Link
              href="/search"
              className="
                text-base lg:text-lg font-bold leading-normal px-2 lg:px-3 py-2 rounded-md transition-all duration-200
                hover:scale-105 active:scale-95
                text-black hover:text-gray-600 hover:bg-gray-100
                dark:text-white dark:hover:text-gray-300 dark:hover:bg-gray-700
              "
            >
              집들이
            </Link>
          </div>
        </nav>
      </div>

      <div className="flex flex-1 justify-end gap-2 sm:gap-4 items-center">
        <div className="hidden sm:flex items-center w-32 sm:w-48 lg:min-w-60 lg:max-w-80">
          <div
            className="
              flex w-full items-stretch rounded-full h-8 sm:h-10 shadow-sm
              bg-gray-50 border border-gray-200
              dark:bg-gray-800 dark:border-gray-600
              hover:shadow-md transition-shadow duration-200
            "
          >
            <div
              className="
                flex items-center justify-center pl-2 sm:pl-4 rounded-l-full
                text-gray-500 dark:text-gray-400
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                className="sm:w-5 sm:h-5"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
              </svg>
            </div>
            <input
              onChange={(e) => setSearchInput(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={handleKeyDown}
              placeholder="통합 검색"
              className="
                flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-full
                focus:outline-none focus:ring-2 border-none h-full px-2 sm:px-4 text-xs sm:text-sm font-normal leading-normal
                transition-all duration-200
                bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:ring-gray-300
                dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-gray-500
              "
              value={searchInput}
            />
          </div>
        </div>
        <SignInCheck />
      </div>
    </header>
  );
}
