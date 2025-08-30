"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HouseCard from "@/components/search/HouseCard";
import { fetchRooms } from "@/lib/api/rooms";
import SearchBar from "@/components/search/SearchBar";

export default function SortedHouseList({
  data: initialData,
  query = "",
}: {
  data: any[];
  query: string; 
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSortType = searchParams.get('order') as "view" | "new" | "like" | null;
  
  // 검색값
  const [searchInput, setSearchInput] = useState(query);

  // 정렬기준 - URL에서 읽어오거나 기본값 사용
  const [sortType, setSortType] = useState<"view" | "new" | "like">(urlSortType || "view");

  // 띄울 데이터
  const [data, setData] = useState<any[]>(initialData);

  // 쿼리가 바뀔 때 실행된다.
  const [inputQuery, setInputQuery] = useState("");

  // query 변경 시 fetch (초기 로드)
  useEffect(() => {
    if (!query) return;
    async function fetchData() {
      console.log("query fetchData 실행");
      const rooms = await fetchRooms("short", sortType, undefined, query);
      setData(rooms);
    }
    fetchData();
  }, [query, sortType]);

  // inputQuery 변경 시 fetch (검색바 입력)
  useEffect(() => {
    if (!inputQuery) return;
    async function fetchData() {
      console.log("inputQuery fetchData 실행");
      const rooms = await fetchRooms("short", sortType, undefined, inputQuery);
      setData(rooms);
    }
    fetchData();
  }, [inputQuery, sortType]);

  return (
    <>
      <div className="px-40 py-5">
        {/* 검색바 */}
        <SearchBar searchInput={searchInput} setSearchInput={setSearchInput} setInputQuery={setInputQuery} setSortType={setSortType}/>
        <div className="flex gap-3 p-3 flex-wrap pr-4">
          {/* // 정렬버튼 */}
          <button
            className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-4 transition-colors duration-200
            ${
              sortType === "view"
                ? "bg-amber-300 dark:bg-orange-800"
                : "bg-amber-50 dark:bg-orange-600 hover:bg-amber-100 dark:hover:bg-orange-700"
            }`}
            onClick={() => {
              setSortType("view");
              router.push(`/search?order=view${(inputQuery || query) ? `&q=${inputQuery || query}` : ''}`);
            }}
          >
            <span className="text-sm">조회수 순</span>
          </button>
          <button
            className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-4 transition-colors duration-200
            ${
              sortType === "new"
                ? "bg-amber-300 dark:bg-orange-800"
                : "bg-amber-50 dark:bg-orange-600 hover:bg-amber-100 dark:hover:bg-orange-700"
            }`}
            onClick={() => {
              setSortType("new");
              router.push(`/search?order=new${(inputQuery || query) ? `&q=${inputQuery || query}` : ''}`);
            }}
          >
            <span className="text-sm">최신 순</span>
          </button>
          <button
            className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-4 pr-4 transition-colors duration-200
            ${
              sortType === "like"
                ? "bg-amber-300 dark:bg-orange-800"
                : "bg-amber-50 dark:bg-orange-600 hover:bg-amber-100 dark:hover:bg-orange-700"
            }`}
            onClick={() => {
              setSortType("like");
              router.push(`/search?order=like${(inputQuery || query) ? `&q=${inputQuery || query}` : ''}`);}
            }
          >
            <span className="text-sm">좋아요 순</span>
          </button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-7 p-4">
          {data.map((house: any) => {
            return <HouseCard key={house.room_id} house={house} />;
          })}
        </div>
      </div>
    </>
  );
}
