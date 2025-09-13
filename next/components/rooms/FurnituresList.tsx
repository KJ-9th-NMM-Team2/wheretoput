"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import ShoppingLink from "../sim/side/ShoppingLink";
import { ChevronLeft, ChevronRight } from "lucide-react";
// 가구 프리뷰 각 가구
export function FurnitureCard({ furniture }: { furniture: any }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-2 pb-3 w-[158px] ">
        <Image
          src={furniture.image_url}
          alt={furniture.name}
          width={100}
          height={100}
          className="w-full h-auto aspect-square object-cover rounded-xl  transition-transform duration-200 hover:scale-120  cursor-pointer"
          onClick={() => setShowModal(true)}
        />
        <p className="text-gray-800 dark:text-gray-100 font-medium text-sm leading-tight overflow-hidden text-ellipsis line-clamp-2">
          {furniture.name}
        </p>
      </div>
      {showModal && (
        <FurnitureModal
          furniture={furniture}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// 가구 팝업 모달 창
export function FurnitureModal({
  furniture,
  onClose,
}: {
  furniture: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full relative mx-4">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl cursor-pointer z-10"
          onClick={onClose}
          aria-label="닫기"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-[#181411] dark:text-gray-100 pr-10">
          {furniture.name}
        </h2>
        <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-4">
          {furniture.brand} / {furniture.price ?? 0}원
        </h3>
        <Image
          src={furniture.image_url}
          alt={furniture.name}
          width={300}
          height={300}
          className=" mb-4 rounded-lg mx-auto"
        />
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-4">
          <p className="text-gray-700 dark:text-gray-300">
            {furniture.description || "설명이 없습니다."}
          </p>
        </div>

        {/*오픈마켓 링크  */}
        <div className="flex justify-center">
          <div className="">
            <ShoppingLink
              furnitureName={furniture.name}
              iconSize={20}
              textSize="text-base"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 페이지네이션 컴포넌트
function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6 pb-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={page === "..."}
          className={`px-3 py-2 rounded-lg transition-colors ${
            page === currentPage
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              : page === "..."
              ? "cursor-default"
              : "border border-gray-300 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// 가구 프리뷰 리스트
export default function FurnituresList({
  room_objects,
  itemsPerPage = 10,
}: {
  room_objects: any[];
  itemsPerPage?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const { paginatedItems, totalPages, totalItems } = useMemo(() => {
    const total = room_objects.length;
    const pages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = room_objects.slice(startIndex, startIndex + itemsPerPage);

    return {
      paginatedItems: items,
      totalPages: pages,
      totalItems: total,
    };
  }, [room_objects, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (room_objects.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        표시할 가구가 없습니다.
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 통계 정보 */}
      <div className="mb-4 text-sm text-gray-600">전체 {totalItems}개 가구</div>

      {/* 가구 그리드 */}
      <div className="grid grid-cols-5  justify-items-center">
        {paginatedItems.map((r) => (
          <FurnitureCard key={r.furniture_id} furniture={r.furnitures} />
        ))}
      </div>

      {/* 페이지네이션 */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
