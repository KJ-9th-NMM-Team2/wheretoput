"use client";

import { HouseSummary } from "@/types/community/Community";
import Link from "next/link";

export default function HouseCard({ house }: { house: HouseSummary }) {
  return (
    <div className="flex flex-col gap-3 pb-3">
      <Link href={`/rooms/${house.room_id}`}>
        <div className="w-full aspect-video rounded-lg overflow-hidden">
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
            {`By: ${house.display_name}`}
          </p>
          <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
            👀 {house.view_count} 👍 {house.num_likes} 💬 {house.num_comments}
          </p>
        </div>
      </Link>
    </div>
  );
}
