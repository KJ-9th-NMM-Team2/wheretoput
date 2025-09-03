import Link from "next/link";
import { HomeCardList } from "@/components/main/HomeCardList";
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
                  url('https://lh3.googleusercontent.com/aida-public/AB6AXuAZD8IlpfGpIstm5yyjufXyxQpetRDdJusSOLgmwVU7T2pq7TjHZdDBth66O9KXVRNM9V-VVjb5cGYs2Yk9b_4FWLwPiVhT942EtAIL19Zg2-rAuayaTZIEBj2jsrZCHvE_Xs6FNSHqBkDhioveQBnupOUGrsD-hLk6Eae5v4nZcIJ75He4QDInx9lSmHl9-aU2J6QN2FMyyv-FpRH1cgPOaW2xeOE3aJRA5Fhrdt4D3FNWDEBxmPKyPxlzyKJbSFT_Cmqd-WsCw90')`,
              }}
            >
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em]">
                  실내 인테리어 디자이너
                </h1>
                <h2 className="text-white text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal">
                  여러분만의 아름다운 집 안에 가구들을 배치해보세요
                </h2>
              </div>
              <SearchBar />

              <div className="flex justify-center">
                <div className="flex flex-1 gap-3 flex-wrap px-4 py-1 max-w-[480px] justify-center">
                  <Link
                    href="/create"
                    passHref
                  >
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#f48225] dark:bg-orange-600 text-[#1c140d] dark:text-white text-base font-bold leading-normal tracking-[0.015em] grow hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors">
                      <span className="truncate">새 집 만들기</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden">
          <div className="flex items-stretch px-4 py-2 gap-8 w-full">
            <HomeCardList rooms={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
