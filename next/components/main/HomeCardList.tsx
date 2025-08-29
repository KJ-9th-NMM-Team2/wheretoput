"use client";
import Link from "next/link";

export function HomeCard({ room }: { room: any }) {
  return (
    <Link href={`/rooms/${room.room_id}`} className="h-full w-full group">
      <div className="flex h-full flex-1 flex-col gap-2 rounded-lg min-w-52 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-lg">
        <div
          className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col"
          style={{
            backgroundImage: `url('${room.thumbnail_url}'), url('/placeholder.png')`,
          }}
        ></div>
        <p className="text-[#1c140d] dark:text-gray-100 text-base font-medium leading-normal">
          {room.title}
        </p>
      </div>
    </Link>
  );
}

export function HomeCardList({ rooms }: { rooms: any[] }) {
  return (
    <>
      {rooms.map((room: any) => (
        <HomeCard key={room.room_id} room={room} />
      ))}
    </>
  );
}
