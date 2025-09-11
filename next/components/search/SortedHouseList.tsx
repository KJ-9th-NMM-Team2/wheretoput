"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HouseCard from "@/components/search/HouseCard";
import { fetchRooms } from "@/lib/api/rooms";
import SearchBar from "@/components/search/SearchBar";

export default function SortedHouseList({
  data: initialData,
  initQuery = "",
}: {
  data: any[];
  initQuery: string; 
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSortType = searchParams.get('order') as "view" | "new" | "like" | null;
  // 쿼리가 바뀔 때 실행된다.
  const [currentQuery, setCurrentQuery] = useState(initQuery);
  
  // 검색값
  const [searchInput, setSearchInput] = useState(initQuery);

  // 정렬기준 - URL에서 읽어오거나 기본값 사용
  const [sortType, setSortType] = useState<"view" | "new" | "like">(urlSortType || "view");

  // 띄울 데이터
  const [data, setData] = useState<any[]>(initialData);  

  // currentQuery 변경 시 fetch (초기 로드)
  useEffect(() => {
    const fetchData = async () => {
      const rooms = await fetchRooms("short", sortType, undefined, currentQuery);
      setData(rooms);
    }
    fetchData();
  }, [currentQuery, sortType]);

  // initQuery 변경 시 ex) header 이용
  useEffect(() => {
    const fetchData = async () => {
      const rooms = await fetchRooms("short", sortType, undefined, initQuery);
      setData(rooms);
    }
    fetchData();
    setCurrentQuery(initQuery);
    setSearchInput(initQuery);
    setSortType("view");
  }, [initQuery]);

  // 검색 실행 함수
  const handlerSearch = (newQuery: string) => {
    setCurrentQuery(newQuery);
    newQuery ? router.push(`/search?order=${sortType}&q=${newQuery}`) : router.push('/search');
  }

  return (
    <>
      <div className="px-40 py-5">
        {/* 검색바 */}
        <SearchBar searchInput={searchInput} setSearchInput={setSearchInput} onSearch={handlerSearch} setSortType={setSortType}/>
        <div className="flex gap-3 p-3 flex-wrap pr-4">
          {/* // 정렬버튼 */}
          <button
            className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-2xl pl-4 pr-4 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg
            ${
              sortType === "view"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-600 border border-gray-200 dark:border-gray-600"
            }`}
            onClick={() => {
              setSortType("view");
              router.push(`/search?order=view${(currentQuery) ? `&q=${currentQuery}` : ''}`);
            }}
          >
            <span className="text-sm">조회수 순</span>
          </button>
          <button
            className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-2xl pl-4 pr-4 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg
            ${
              sortType === "new"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-600 border border-gray-200 dark:border-gray-600"
            }`}
            onClick={() => {
              setSortType("new");
              router.push(`/search?order=new${(currentQuery) ? `&q=${currentQuery}` : ''}`);
            }}
          >
            <span className="text-sm">최신 순</span>
          </button>
          <button
            className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-2xl pl-4 pr-4 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg
            ${
              sortType === "like"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-600 border border-gray-200 dark:border-gray-600"
            }`}
            onClick={() => {
              setSortType("like");
              router.push(`/search?order=like${(currentQuery) ? `&q=${currentQuery}` : ''}`);}
            }
          >
            <span className="text-sm">좋아요 순</span>
          </button>
        </div>
        {data && data.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-7 p-4">
            {data.map((house: any) => (
              <HouseCard key={house.room_id} house={house} />
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-60">
            <p className="text-gray-500">입력된 방 혹은 유저를 찾을 수 없습니다</p>
          </div>
        )}
      </div>
    </>
  );
}
