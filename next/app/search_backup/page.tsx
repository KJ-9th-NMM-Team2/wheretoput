"use client";
import { useState } from "react";

export default function SearchPage() {
  
  return (
    <>
      <div className="layout-container flex h-full grow flex-col dark:bg-gray-900">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            
            <h2 className="text-[#181411] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Results
            </h2>
            <div className="pb-3">
              <div className="flex border-b border-[#e6dfdb] dark:border-gray-700 px-4 gap-8">
                <a
                  className="flex flex-col items-center justify-center border-b-[3px] border-b-[#181411] dark:border-b-white text-[#181411] dark:text-white pb-[13px] pt-4"
                  href="#"
                >
                  <p className="text-[#181411] dark:text-white text-sm font-bold leading-normal tracking-[0.015em]">
                    Sort by Likes
                  </p>
                </a>
                <a
                  className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#8a7260] dark:text-gray-400 pb-[13px] pt-4"
                  href="#"
                >
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-bold leading-normal tracking-[0.015em]">
                    Sort by Date
                  </p>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBuvZGpzbr8dSZxuK2zyl-sMQfZiUR2djUzTZzAc9pyEU7Bj-ZzecaCd7UOYmjZIZ1Oqzm7xWJ1-BIovJzon4ygatYs_WMmkjeIjLZkxDYGI8IJg0wEtbVCkwA5Dmqb7htQxLnxzTlmbnjPNaCJN6_NL-67Rt10wzO9iM3oLHs5a72OMrwUEimyYlfBg-nRnDAPjmHoCGAceQvQG15wmmbm17RkPi-lO7ZEGrC2HDyfhz6wtHzQx7ZwfLyYxkcLkZE3nlNS-KbU_tPQ")`,
                  }}
                ></div>
                <div>
                  <p className="text-[#181411] dark:text-white text-base font-medium leading-normal">
                    Cozy Living Room
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    By Olivia Carter
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    123 Likes
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDY9r9kCKFxHAGrqcUSMYuSp2rH4g-rpCNO8610RdF0FxRtdvjBJMPyTpK2XQfg6WmHw9Hx5vY17k9eNHrxpLcPoMNDwpYdTx318GecUy6A5lAa5fTFpOf9z9Pg5xdsW6Q39su-MyiGwhfWg_kM3JY4QHCMz4Ua2t5V-C1a1nV_epfXpk8vGC5ya155pIVC45S6yTcojUZy44Zg5PVVfMFeVbuL4DnYpU-nd_dOSi7ZXgC7lpQWNSuCYFHKzyxbjUwtO2DlMMeZ1Wbz")`,
                  }}
                ></div>
                <div>
                  <p className="text-[#181411] dark:text-white text-base font-medium leading-normal">
                    Modern Living Room
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    By Ethan Kim
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    456 Likes
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBKSu28na4SgCR8W1JXc4ik7fvBqV8onuA_yOQEN7yyNmLTW74u0G997nAM0hnk93PlbV_a1cleFsuViMQV-p3dGFjyQz7fQulfFhBIp4EMjisIalGeycPNJAmHQv6xbJds_hDeS4A2jgj0_VTqiVFuHjT12ee8tecE89NEuKNu0sS_-3GXJc-3w24PFajm5nGBDE_og18X-ZJnrBiZFS--TvZxXp7quClGoGDTQtpNeksGAX-AfY0OLf48Fksq4-o57fI8tIlKn2o4")`,
                  }}
                ></div>
                <div>
                  <p className="text-[#181411] dark:text-white text-base font-medium leading-normal">
                    Minimalist Living Room
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    By Chloe Wong
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    789 Likes
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuC6Dqk1mEDGOjMzBeytq84n91mJo3JqOgAj-23WN3EtVndxedpX7Q7ltC8Rcr9TY1IsY8NCQBgEjA7dBXft-MfhhwnfY4vRIcyzQ_18AmawJJEubQx-lf3Q8FulYcX21uWBr0LaZ3obYR5Hyp0F87VIFLeXG2PSpy_V2-2AtSbBwKBCZG5GLgvxSc4OACcC8y_yRNx4Wip1fL2Ora3tshYgQfYNWCrWH6q7a3PPhMsU4alA4lii_gdD2gzC5v0N71SV_0trKBrFsBC9")`,
                  }}
                ></div>
                <div>
                  <p className="text-[#181411] dark:text-white text-base font-medium leading-normal">
                    Rustic Living Room
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    By Ryan Taylor
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    101 Likes
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxQeCrQr4GZc_TSQ1Hnmk_FKzNkRhOEuPrltTvxywiGmKqjw3fRh03LCjZ3TS3CAPJi8TSC5pH0T4KjQH61hUfq1awYWbzxSFaLvN98_EkLtjmdje3ZMDkxaUKQM3e1rS6F50Tdv9PW01j4g1GgvIE77PgUGmUJhkG7ihp8IXxT221m1oFJiZMazgEgU0dMZX8pnDJxFTCoEOmxrQ6hVB3AxfiNYuAscfjI331OpV0z23wLNrY6w9UY9hZQ6cUVw0H_q7Yo0M2Uypi")`,
                  }}
                ></div>
                <div>
                  <p className="text-[#181411] dark:text-white text-base font-medium leading-normal">
                    Bohemian Living Room
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    By Sophia Adams
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    202 Likes
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuACHnwx4Xg6f5dvad0YZeRFsv4ATPGAfEsCedFwjfrdh6wvleJCOEcvelQz2uP8VmMHDGTb2u8qpwcdVlL5cbS-Wc91UvV4dFP42LEdUcU-PBAoniE9fam2VKSr78a2qzx3xXXaTWIIR8D-83-DWD8epaQ48Vv2nsw_D4WosqtHaPSY3eOQA1IHwW7Uu52eF5xtyVxSEFBtvXqUTLyfLT3W7fUWlcq9hcpnDfIC5_SlXcMZuF-ad1Gs6nzRlPJTn9Tit_cwIaTRP_ko")`,
                  }}
                ></div>
                <div>
                  <p className="text-[#181411] dark:text-white text-base font-medium leading-normal">
                    Industrial Living Room
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    By Brandon Harris
                  </p>
                  <p className="text-[#8a7260] dark:text-gray-400 text-sm font-normal leading-normal">
                    303 Likes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
