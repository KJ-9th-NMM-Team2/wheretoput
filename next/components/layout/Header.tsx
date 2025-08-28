"use client";
import Link from "next/link";
import { useState } from "react";
import SignInButton from "@/components/login/SignInButton";
import SignOutButton from "@/components/login/SignOutButton";
import { useSession } from "next-auth/react";
import { auth } from "@/lib/auth";

// 로그인되어 있으면 로그아웃, 로그아웃되어 있으면 로그인 버튼
export function SignInCheck() {
  const { data: session} = useSession();

  if (!session?.user) return <SignInButton />;
  console.log(session.user);
  return <SignOutButton />;
}

export default function Header() {
  const [searchInput, setSearchInput] = useState("");

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
            href="/follows"
            className="
              text-md font-medium leading-normal px-3 py-2 rounded-md transition-all duration-200
              hover:scale-105 active:scale-95
              text-gray-700 hover:text-amber-800 hover:bg-amber-50
              dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700
            "
          >
            이웃집 들리기
          </Link>
          <Link
            href="/community"
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

      {/* <div
        onClick={() => signIn("google")}
        className="
            bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 
            transition-all duration-200 hover:scale-110 hover:ring-4 cursor-pointer
            ring-amber-200 hover:ring-amber-300
            dark:ring-gray-600 dark:hover:ring-amber-400
          "
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDB_fayd9UBn_M9ukHwpMjnE5Nf6lmNdsA6dryhy2fHrvdtIqk4h1Z-6dDHmKitRTplwMkUzLSI_cLqBwJZjd_dAfiw3Ui98575Y5Paw1PPiVds5WHoUkJMUSKYHAhL5Sk0HUxa9SPVxjp02uZC5IMOZP57cV63yLihWFFHJ_zKZkG263LrvVBEwflolUbuTraAyFZBvEpxOzfPy7P45CLYx84icTrQceH547VrUeOsMKV8ZqWf2S3iWeJZ2HfX84VO-WW78Wtp_0w')`,
        }}
      ></div> */}
    </header>
  );
}
