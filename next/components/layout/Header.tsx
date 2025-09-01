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
  } else return <div className="w-10 h-10"></div>;
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
        flex items-center justify-between whitespace-nowrap border-b border-solid px-6 py-4 transition-all duration-200
        border-amber-100 bg-white/95 backdrop-blur-sm shadow-sm
        dark:border-gray-700 dark:bg-gray-900 dark:shadow-lg
        sticky top-0 z-50
      "
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 text-amber-900 dark:text-amber-100">
          <Link href="/">
            <h2 className="text-xl font-bold leading-tight tracking-tight hover:text-amber-600 transition-colors duration-200 cursor-pointer">
              어따놀래
            </h2>
          </Link>
        </div>
        <nav className="flex items-center gap-8">
          <Link
            href="/create"
            rel="noopener noreferrer"
            className="
              text-md font-medium leading-normal px-3 py-2 rounded-md transition-all duration-200
              hover:scale-105 active:scale-95
              text-gray-700 hover:text-amber-800 hover:bg-amber-50
              dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700
            "
          >
            집 만들기
          </Link>

          <Link
            href="/search"
            className="
              text-md font-medium leading-normal px-3 py-2 rounded-md transition-all duration-200
              hover:scale-105 active:scale-95
              text-gray-700 hover:text-amber-800 hover:bg-amber-50
              dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700
            "
          >
            둘러보기
          </Link>
        </nav>
      </div>

      <div className="flex flex-1 justify-end gap-4 items-center mr-5">
        <div className="flex items-center min-w-60 max-w-80">
          <div
            className="
              flex w-full items-stretch rounded-full h-10 shadow-sm
              bg-amber-50 border border-amber-200
              dark:bg-gray-800 dark:border-gray-600
              hover:shadow-md transition-shadow duration-200
            "
          >
            <div
              className="
                flex items-center justify-center pl-4 rounded-l-full
                text-amber-600 dark:text-gray-400
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
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
              placeholder="검색어를 입력하세요"
              className="
                flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-full 
                focus:outline-none focus:ring-2 border-none h-full px-4 text-sm font-normal leading-normal
                transition-all duration-200
                bg-amber-50 text-gray-900 placeholder:text-amber-400 focus:ring-amber-300
                dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-amber-400
              "
              value={searchInput}
            />
          </div>
        </div>
      </div>
      <SignInCheck />
    </header>
  );
}
