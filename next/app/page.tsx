import Link from "next/link";
import { HomeCardList } from "@/components/main/HomeCardList";
import { FollowingFeed } from "@/components/main/FollowingFeed";
import { fetchRooms } from "@/lib/api/room/rooms";
import SearchBar from "@/components/main/SearchBar";

export default async function Page() {
  const data = await fetchRooms("short", "view", 4);

  return (
    <div className="px-4 sm:px-8 lg:px-20 flex flex-1 justify-center py-2">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        <div className="@container">
          <div className="@[480px]:p-4">
            <div
              className="relative flex min-h-[200px] sm:min-h-[500px] flex-col gap-4 sm:gap-6 lg:gap-8 bg-cover bg-center bg-no-repeat @[480px]:rounded-xl justify-center p-4 sm:p-8 lg:p-12"
              style={{
                backgroundImage: `linear-gradient(
                  rgba(255, 255, 255, 0.85) 0%,
                  rgba(255, 255, 255, 0.75) 100%
                  ),
                  url('/main_background.avif')`,
              }}
            >
              {/* 메인 타이틀 */}
              <div className="flex flex-col gap-2 sm:gap-4 max-w-2xl">
                <h1 className="text-black text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight tracking-tight">
                  상상하던 공간,
                </h1>
                <h2 className="text-black text-2xl sm:text-3xl lg:text-5xl font-bold leading-tight tracking-tight">
                  3D로 손쉽게 현실로.
                </h2>

                {/* 서브 텍스트 */}
                <div className="flex flex-col gap-1 mt-2 sm:mt-4">
                  <p className="text-black font-semibold text-sm sm:text-base lg:text-lg leading-relaxed sm:hidden">
                    집 만들기는 데스크톱에서만 지원
                  </p>
                  <p className="text-black font-semibold text-sm sm:text-base lg:text-lg leading-relaxed sm:hidden">
                    모바일에선 집들이만 가능합니다
                  </p>
                  <p className="text-black font-semibold text-sm sm:text-base lg:text-lg leading-relaxed hidden sm:block">
                    나만의 집을 만들고
                  </p>
                  <p className="text-black font-semibold text-sm sm:text-base lg:text-lg leading-relaxed hidden sm:block">
                    다른 사람들과 영감을 공유해보세요
                  </p>
                </div>
              </div>

              {/* 시작 버튼 */}
              <div className="mt-4 sm:mt-6 lg:mt-8 flex justify-center hidden sm:flex">
                <Link href="/create" passHref>
                  <button className="text-lg sm:text-xl lg:text-2xl px-3 sm:px-4 py-2 sm:py-3 lg:py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer tracking-wider">
                    Get Started
                  </button>
                </Link>
              </div>

              {/* [09.15] 메인아이콘 자리 */}
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4">
                <img
                  src="/asset/wheretoput.png"
                  alt="WheretoPut"
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 opacity-100"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <h2 className="text-2xl font-bold text-[#1c140d] dark:text-gray-100">
              주목받는 집
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-orange-400"></div>
          </div>
        </div>

        <div className="px-2 sm:px-4 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 justify-items-center">
            <HomeCardList rooms={data.slice(0, 3)} />
          </div>
        </div>

        {/* 팔로잉 피드 섹션 */}
        <FollowingFeed />
      </div>
    </div>
  );
}
