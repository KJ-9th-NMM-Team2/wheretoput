"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HomeCard } from "@/components/main/HomeCardList";
import { fetchRooms } from "@/lib/api/room/rooms";
import SearchBar from "@/components/search/SearchBar";
import { PaginationControls } from "@/components/ui/Pagination";

export default function SortedHouseList({
  data: initialData,
  initQuery = "",
}: {
  data: any[];
  initQuery: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSortType = searchParams.get("order") as
    | "view"
    | "new"
    | "like"
    | null;
  // 쿼리가 바뀔 때 실행된다.
  const [currentQuery, setCurrentQuery] = useState(initQuery);

  // 검색값
  const [searchInput, setSearchInput] = useState(initQuery);

  // 정렬기준 - URL에서 읽어오거나 기본값 사용
  const [sortType, setSortType] = useState<"view" | "new" | "like">(
    urlSortType || "view"
  );

  // 띄울 데이터
  const [data, setData] = useState<any[]>(initialData);

  // currentQuery 변경 시 fetch (초기 로드)
  useEffect(() => {
    const fetchData = async () => {
      const rooms = await fetchRooms(
        "short",
        sortType,
        undefined,
        currentQuery
      );
      setData(rooms);
    };
    fetchData();
  }, [currentQuery, sortType]);

  // initQuery 변경 시 ex) header 이용
  useEffect(() => {
    const fetchData = async () => {
      const rooms = await fetchRooms("short", sortType, undefined, initQuery);
      setData(rooms);
    };
    fetchData();
    setCurrentQuery(initQuery);
    setSearchInput(initQuery);
    setSortType("view");
  }, [initQuery]);

  // 검색 실행 함수
  const handlerSearch = (newQuery: string) => {
    setCurrentQuery(newQuery);
    newQuery
      ? router.push(`/search?order=${sortType}&q=${newQuery}`)
      : router.push("/search");
  };

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { paginatedRooms, totalPages, totalRooms } = useMemo(() => {
    const total = data.length;
    const pages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = data.slice(startIndex, startIndex + itemsPerPage);

    return {
      paginatedRooms: items,
      totalPages: pages,
      totalRooms: total,
    };
  }, [data, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="px-20 flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
          {/* 검색바 */}
          <SearchBar
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            onSearch={handlerSearch}
            setSortType={setSortType}
          />
          <div className="flex gap-3 p-3 flex-wrap pr-4">
            {/* // 정렬버튼 */}
            <button
              className={`tool-btn ${
                sortType === "view" ? "tool-btn-active" : "tool-btn-inactive"
              }`}
              onClick={() => {
                setSortType("view");
                router.push(
                  `/search?order=view${
                    currentQuery ? `&q=${currentQuery}` : ""
                  }`
                );
              }}
            >
              <span className="text-sm">조회수 순</span>
            </button>
            <button
              className={`tool-btn ${
                sortType === "new" ? "tool-btn-active" : "tool-btn-inactive"
              }`}
              onClick={() => {
                setSortType("new");
                router.push(
                  `/search?order=new${currentQuery ? `&q=${currentQuery}` : ""}`
                );
              }}
            >
              <span className="text-sm">최신 순</span>
            </button>
            <button
              className={`tool-btn ${
                sortType === "like" ? "tool-btn-active" : "tool-btn-inactive"
              }`}
              onClick={() => {
                setSortType("like");
                router.push(
                  `/search?order=like${
                    currentQuery ? `&q=${currentQuery}` : ""
                  }`
                );
              }}
            >
              <span className="text-sm">좋아요 순</span>
            </button>
          </div>
          {paginatedRooms && paginatedRooms.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
                {paginatedRooms.map((house: any) => (
                  <HomeCard key={house.room_id} room={house} />
                ))}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              ></PaginationControls>
            </>
          ) : (
            <div className="flex justify-center items-center h-60">
              <p className="text-gray-500">
                입력된 방 혹은 유저를 찾을 수 없습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
