"use client";
import { signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function UserBubble({
  name,
  user_id,
  image,
}: {
  name: string;
  user_id: string;
  image: string;
}) {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className="relative inline-block">
      <div
        onClick={() => setOpen((prev) => !prev)}
        className="
        bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 
        transition-all duration-200 hover:scale-110 hover:ring-4 cursor-pointer
        ring-amber-200 hover:ring-amber-300
        dark:ring-gray-600 dark:hover:ring-amber-400
        "
        style={{
          backgroundImage: image ? `url('${image}')` : "none",
        }}
      ></div>
      {open && (
        <div className="absolute right-0 mt-2 min-w-30  bg-white dark:bg-gray-800 rounded shadow-lg z-10">
          <div className="px-4 py-2 text-gray-800 dark:text-gray-200 border-b">
            {name}
          </div>
          <Link
            href={`/users/${user_id}`}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-none"
          >
            마이페이지
          </Link>
          <button
            className="block w-full hover:cursor-pointer px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 rounded-none"
            onClick={() => signOut()}
            type="button"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
