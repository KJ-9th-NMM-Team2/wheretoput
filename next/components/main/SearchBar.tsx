"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        router.push(`/search?q=${encodeURIComponent(searchInput)}`);
    }
  }

  const handleClickSearch = () => {
      router.push(`/search?q=${encodeURIComponent(searchInput)}`);
  }

  return (
    <label className="flex flex-col min-w-40 h-14 w-full max-w-[480px] @[480px]:h-16">
      <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
        <div
          className="text-[#9c6f49] dark:text-orange-300 flex border border-[#e8dace] dark:border-gray-600 bg-[#fcfaf8] dark:bg-gray-700 items-center justify-center pl-[15px] rounded-l-xl border-r-0"
          data-icon="MagnifyingGlass"
          data-size="20px"
          data-weight="regular"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20px"
            height="20px"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
          </svg>
        </div>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="집 이름, 사용자명, 초대코드로 검색"
          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#1c140d] dark:text-gray-100 focus:outline-0 focus:ring-0 border border-[#e8dace] dark:border-gray-600 bg-[#fcfaf8] dark:bg-gray-700 focus:border-[#e8dace] dark:focus:border-gray-500 h-full placeholder:text-[#9c6f49] dark:placeholder:text-gray-400 px-[15px] rounded-r-none border-r-0 pr-2 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal"
        />
        <div className="flex items-center justify-center rounded-r-xl border-l-0 border border-[#e8dace] dark:border-gray-600 bg-[#fcfaf8] dark:bg-gray-700 pr-[7px]">
          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base @[480px]:font-bold @[480px]:leading-normal @[480px]:tracking-[0.015em] hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            onClick={handleClickSearch}
          >
            <span className="truncate">검색</span>
          </button>
        </div>
      </div>
    </label>
  );
}
