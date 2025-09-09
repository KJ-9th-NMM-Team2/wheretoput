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
              className="flex min-h-[360px] flex-col gap-4 bg-cover bg-center bg-no-repeat @[480px]:gap-6 @[480px]:rounded-xl items-center justify-center p-4"
              style={{
                backgroundImage: `linear-gradient(
                  rgba(0, 0, 0, 0.1) 0%,
                  rgba(0, 0, 0, 0.4) 100%
                  ),
                  url('/main_background.avif')`,
              }}
            >
              <div className="flex flex-col gap-2 text-center backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl">
                <h1 className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent text-4xl font-bold leading-[1.1] tracking-[-0.02em] @[480px]:text-5xl @[480px]:font-bold @[480px]:leading-[1.1] @[480px]:tracking-[-0.02em] drop-shadow-lg hover:scale-105 transition-transform duration-500">
                  실내 인테리어 디자이너
                </h1>
                <h2 className="text-white text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal drop-shadow-md">
                  여러분만의 아름다운 집 안에 가구들을 배치해보세요 !
                </h2>
              </div>
              <SearchBar />

              <div className="flex justify-center">
                <div className="flex flex-1 gap-3 flex-wrap px-4 py-1 max-w-[480px] justify-center">
                  <Link
                    href="/create"
                    passHref
                  >
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-12 px-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-base font-bold leading-normal tracking-[0.015em] grow hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                      <span className="truncate">새 집 만들기</span>
                    </button>
                  </Link>
                </div>
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
        <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden">
          <div className="flex items-stretch px-4 py-2 gap-8 w-full">
            <HomeCardList rooms={data} />
          </div>
        </div>
        
        {/* 팔로잉 피드 섹션 */}
        <FollowingFeed />
      </div>
    </div>
  );
}
