"use client";
import { useState } from "react";
import Image from "next/image";
import ShoppingLink from "../sim/side/ShoppingLink";
// 가구 프리뷰 각 가구
export function FurnitureCard({ furniture }: { furniture: any }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div
        className="flex flex-col gap-2 pb-3 w-[158px] cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg"
        onClick={() => setShowModal(true)}
      >
        <img
          src={furniture.image_url}
          alt={furniture.name}
          className="w-full h-auto aspect-square object-cover rounded-xl transition-opacity duration-200 hover:opacity-90"
        />
        <p className="text-[#181411] dark:text-gray-100 text-base font-medium leading-normal">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full relative">
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
        <h3>
          {furniture.brand} / {furniture.price ?? 0}원
        </h3>
        <img
          src={furniture.image_url}
          alt={furniture.name}
          className="w-full h-auto mb-4 rounded-lg max-w-[180px] mx-auto"
        />
        <p className="text-[#181411] dark:text-gray-100 mb-4">
          {furniture.description || "설명이 없습니다."}
        </p>

        {/*오픈마켓 링크: 아이콘,폰트사이즈 크게 */}
        <div className="flex justify-center">
          <ShoppingLink furnitureName={furniture.name} iconSize={20} textSize="text-base" />
        </div>
      </div>
    </div>
  );
}

// 가구 프리뷰 리스트
export default function FurnituresList({
  room_objects,
}: {
  room_objects: any[];
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
      <div className="flex flex-wrap gap-6">
        {room_objects.map((r) => (
          <FurnitureCard key={r.furniture_id} furniture={r.furnitures} />
        ))}
      </div>
    </div>
  );
}
