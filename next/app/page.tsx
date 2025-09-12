import Link from "next/link";
import { HomeCardList } from "@/components/main/HomeCardList";
import { FollowingFeed } from "@/components/main/FollowingFeed";
import { fetchRooms } from "@/lib/api/rooms";
import SearchBar from "@/components/main/SearchBar";

export default async function Page() {
  const data = await fetchRooms("short", "view", 4);

  return (
    <div className="px-20 flex flex-1 justify-center py-2">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        <div className="@container">
          <div className="@[480px]:p-4">
            <div
              className="relative flex min-h-[500px] flex-col gap-8 bg-cover bg-center bg-no-repeat @[480px]:rounded-xl justify-center p-12"
              style={{
                backgroundImage: `linear-gradient(
                  rgba(255, 255, 255, 0.85) 0%,
                  rgba(255, 255, 255, 0.75) 100%
                  ),
                  url('/main_background.avif')`,
              }}
            >
              {/* 메인 타이틀 */}
              <div className="flex flex-col gap-4 max-w-2xl">
                <h1 className="text-black text-6xl font-black leading-tight tracking-tight">
                  상상하던 공간,
                </h1>
                <h2 className="text-black text-5xl font-black leading-tight tracking-tight">
                  3D로 손쉽게 현실로.
                </h2>
                
                {/* 서브 텍스트 */}
                <div className="flex flex-col gap-1 mt-4">
                  <p className="text-black font-semibold text-lg leading-relaxed">
                    나만의 집을 만들고
                  </p>
                  <p className="text-black font-semibold text-lg leading-relaxed">
                    다른 사람들과 영감을 공유해보세요
                  </p>
                </div>
              </div>


              {/* 시작 버튼 */}
              <div className="mt-8 flex justify-center ">
                <Link href="/create" passHref>
                  <button className="text-2xl px-4 py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer tracking-wider">
                    Get Started
                  </button>
                </Link>
               
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-[#1c140d] dark:text-gray-100">
              주목받는 집
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-orange-400"></div>
          </div>
        </div>
        <div className="px-4 pb-8">
          <div className="grid grid-cols-3 gap-8 justify-items-center">
            <HomeCardList rooms={data.slice(0, 3)} />
          </div>
        </div>

        {/* 팔로잉 피드 섹션 */}
        <FollowingFeed />
      </div>
    </div>
  );
}
