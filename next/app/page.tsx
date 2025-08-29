"use client";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const [searchInput, setSearchInput] = useState("");
  return (
    <div className="px-40 flex flex-1 justify-center py-5">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        <div className="@container">
          <div className="@[480px]:p-4">
            <div
              className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-center justify-center p-4"
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
              <label className="flex flex-col min-w-40 h-14 w-full max-w-[480px] @[480px]:h-16">
                <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                  <div
                    className="text-[#9c6f49] dark:text-orange-300 flex border border-[#e8dace] dark:border-gray-600 bg-[#fcfaf8] dark:bg-gray-700 items-center justify-center pl-[15px] rounded-l-xl border-r-0"
                    data-icon="MagnifyingGlass"
                    data-size="20px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20px"
                      height="20px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                    </svg>
                  </div>
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="집 이름, 사용자명, 초대코드로 검색"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#1c140d] dark:text-gray-100 focus:outline-0 focus:ring-0 border border-[#e8dace] dark:border-gray-600 bg-[#fcfaf8] dark:bg-gray-700 focus:border-[#e8dace] dark:focus:border-gray-500 h-full placeholder:text-[#9c6f49] dark:placeholder:text-gray-400 px-[15px] rounded-r-none border-r-0 pr-2 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal"
                  />
                  <div className="flex items-center justify-center rounded-r-xl border-l-0 border border-[#e8dace] dark:border-gray-600 bg-[#fcfaf8] dark:bg-gray-700 pr-[7px]">
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-[#f48225] dark:bg-orange-600 text-[#1c140d] dark:text-white text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base @[480px]:font-bold @[480px]:leading-normal @[480px]:tracking-[0.015em] hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors">
                      <span className="truncate">검색</span>
                    </button>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden">
          <div className="flex items-stretch p-4 gap-3">
            <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60">
              <div
                className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBaOSbap4k8ir4s7CUM8mfS250H6iGJanhWOho_adws3ZzmU5g3ashLQ3EEbw4548aW_Ut9u9UUsjCHYGJ6FE_G_Ute-wm7BSoT3wXMMYiPxTBnZsfUouGm1p2vFuOBLi25PlBdMu_pO1-0rqhyWsOIoQc_uKDH2q4EStS62ADPkT7WMEmyfBV1X7DDHCjB7XSJ98dd8xKYa8UzpKg0CqE9Fh34M8Y4Zg3xPCL0zQzrZRF21BC-DLJR0hzWYGuaW0Net9IHrHzNIL0')`,
                }}
              ></div>
              <p className="text-[#1c140d] dark:text-gray-100 text-base font-medium leading-normal">
                원룸
              </p>
            </div>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60">
              <div
                className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDFzx09pCrxbPvp2y_S3Vi19-D4mnvwDxrwnqPhFbrU0ztGCdpqNbU3V6OVuQe-ZhfIT3E7HGXdcJ-ALXYCrCTtTAuMaFVf7om9TGMa3dGk0kqh6bLOBPbHSOkounNxT4jbtLaqJCVSH_u7OzTiDnP6okaWM12Ne8TS-T4qO1euluW9grSogT_9OvaU45YAALW5bZreNoUrytSX9-bAZQ5Q-jmsTPi-3WDXT9UUGk_XVR8b8n-iDBUrAdDhf79b3_1tM6nb0W45ALk')`,
                }}
              ></div>
              <p className="text-[#1c140d] dark:text-gray-100 text-base font-medium leading-normal">
                크래프톤 정글 기숙사
              </p>
            </div>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60">
              <div
                className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC8Sc_MRcZ_unwISKxt8fS_M8geS-2gXi6kY6VaJN7HBlYn1a1tR_5wfNSuVzHVHaXjtUja5kt8cg_nepS95nFdRiiTAATdnw9dsfAyqQFkxatM4igD9PkxlEvtEDdmoVCfnbJNA6wDeuX2oxKXUEM9XghZB4F-jfPzVJi15hczSLhnnM0144UYdAIUrlAcDatEmInvHBGh62TIdmcjSfkj6MBXuh4xqNE6sz69zln8KvilnX_NAB7SjiWg059UNLqH8fKU6L4BJmk')`,
                }}
              ></div>
              <p className="text-[#1c140d] dark:text-gray-100 text-base font-medium leading-normal">
                30평 가정집
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 max-w-[480px] justify-center">
            <Link href="/create" passHref>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#f48225] dark:bg-orange-600 text-[#1c140d] dark:text-white text-base font-bold leading-normal tracking-[0.015em] grow hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors">
                <span className="truncate">새 집 만들기</span>
              </button>
            </Link>
            <Link href="/community" passHref>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#f4ede7] dark:bg-gray-700 text-[#1c140d] dark:text-gray-100 text-base font-bold leading-normal tracking-[0.015em] grow hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
                <span className="truncate">다른 집 구경하기</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
