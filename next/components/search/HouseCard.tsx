"use client";

import Link from "next/link";
import { FaEye } from "react-icons/fa";
import { FcLike } from "react-icons/fc";
import { FaCommentDots } from "react-icons/fa6";

export default function HouseCard({ 
  house, 
  isDeleteMode = false, 
  onThumbnailClick 
}: { 
  house: any; 
  isDeleteMode?: boolean; 
  onThumbnailClick?: () => void; 
}) {
  const handleThumbnailClick = (e: React.MouseEvent) => {
    if (isDeleteMode) {
      e.preventDefault();
      onThumbnailClick?.();
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-3 group w-full max-w-xs">
      <Link href={isDeleteMode ? "#" : `/rooms/${house.room_id}`}>
        <div 
          className="mb-2 w-full aspect-video rounded-lg overflow-hidden transition-transform duration-200 group-hover:scale-105"
          onClick={handleThumbnailClick}
        >
          <img
            src={
              house.thumbnail_url
                ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${house.thumbnail_url}`
                : "/placeholder.png"
            }
            alt={house.title}
            className="w-full h-full object-cover bg-center"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        </div>
        <div onClick={handleThumbnailClick}>
          <p className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">
            {house.title}
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-normal leading-normal">
            {`By: ${house.user.name}`}{" "}
            {house.is_public ? (
              ""
            ) : (
              <span className="ml-2 px-2 py-1 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 dark:bg-gray-700 text-red-600 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-400">
                비공개
              </span>
            )}
          </p>

          <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal flex items-center gap-2">
             <FcLike /> {house.num_likes} 
             <FaCommentDots className="text-gray-500" /> {house.num_comments}
             <FaEye className="text-blue-500" /> {house.view_count}
          </p>
        </div>
      </Link>
    </div>
  );
}
