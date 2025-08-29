"use client";

import Link from "next/link";

export default function HouseCard({ house }: { house: any }) {
  return (
    <div className="flex flex-col gap-3 pb-3 group">
      <Link href={`/rooms/${house.room_id}`}>
        <div className="mb-2 w-full aspect-video rounded-lg overflow-hidden transition-transform duration-200 group-hover:scale-105">
          <img
            src={house.thumbnail_url ?? "/placeholder.png"}
            alt={house.title}
            className="w-full h-full object-cover bg-center"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        </div>
        <div>
          <p className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">
            {house.title}
          </p>
          <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
            {`By: ${house.user.name}`}
          </p>
          <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
            👀 {house.view_count} 👍 {house.num_likes} 💬 {house.num_comments}
          </p>
        </div>
      </Link>
    </div>
  );
}
