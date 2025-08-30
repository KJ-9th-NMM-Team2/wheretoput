import { fetchUserById, fetchUserRooms } from "@/lib/api/users";
import HouseCard from "@/components/search/HouseCard";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const user = await fetchUserById(id);
    const userRooms = await fetchUserRooms(id, "short", "new");
    console.log("user", user.profile_image);

    return (
      <div className="px-40 py-5">
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-orange-600 flex items-center justify-center overflow-hidden">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-amber-700 dark:text-orange-200">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {user.display_name || user.name}
              </h1>
              <p className="text-amber-700 dark:text-orange-300 text-lg">
                @{user.name}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                공개 방 {user.public_rooms_count}개
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {user.display_name || user.name}님의 방들
          </h2>
        </div>

        {userRooms.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-7 p-4">
            {userRooms.map((house: any) => (
              <HouseCard key={house.room_id} house={house} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              아직 공개된 방이 없습니다.
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error fetching user data:", error);
    return (
      <div className="px-40 py-5">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            사용자를 찾을 수 없습니다
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            요청하신 사용자 정보를 불러올 수 없습니다.
          </p>
        </div>
      </div>
    );
  }
}
