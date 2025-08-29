// 방 상세 정보 페이지 - 상록
export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // /pages/[id]에 해당하는 id 값
  return (
    <>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap gap-2 p-4">
              <a
                className="text-[#8a7260] dark:text-orange-300 text-base font-medium leading-normal"
                href="#"
              >
                페이지 ID - {id}
              </a>
              <span className="text-[#8a7260] dark:text-orange-300 text-base font-medium leading-normal">
                /
              </span>
              <span className="text-[#181411] dark:text-gray-100 text-base font-medium leading-normal">
                Living Room
              </span>
            </div>
            <div className="@container">
              <div className="@[480px]:px-4 @[480px]:py-3">
                <div
                  className="bg-cover bg-center flex flex-col justify-end overflow-hidden bg-white dark:bg-gray-800 @[480px]:rounded-xl min-h-80"
                  style={{
                    backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 25%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCqgDEg0oHeSFvy3FXVrwPhwix5PEGkDW2OwNfA82YNZhVg8wub5YvgHCxgejnDt-xxpyNRCy9uEVrXDWjUkSHjIa2PaZxtUohhrK51AUQcAm1kjotyFikvQMmc2Z17JzQ9QWIiM2Gr_1k4A9yCKizT4pICeilhQcPdisNb72NR5UNXyZpSWD1Kj3saGmQTF_qcl1nl5ruQ8bvOR6QJHrt0Q9zQqvd9RziXCJXTgnXjaFPiAvbUL-r7D0dsAQlCRfreoTgahohB4RiR")`,
                  }}
                >
                  <div className="flex p-4">
                    <p className="text-white tracking-light text-[28px] font-bold leading-tight">
                      Modern Living Room
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f5f2f0] dark:bg-gray-700 text-[#181411] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
                  <span className="truncate">View in 3D</span>
                </button>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f5f2f0] dark:bg-gray-700 text-[#181411] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
                  <span className="truncate">Add to favorite</span>
                </button>
              </div>
            </div>
            <p className="text-[#181411] dark:text-gray-100 text-base font-normal leading-normal pb-3 pt-1 px-4">
              Created by Olivia Carter on January 15, 2024
            </p>
            <p className="text-[#181411] dark:text-gray-100 text-base font-normal leading-normal pb-3 pt-1 px-4">
              A modern living room design featuring a neutral color palette with
              pops of blue and green. The room includes a large sectional sofa,
              a coffee table, and a media console. The walls are adorned with
              abstract art, and the space is filled with natural light.
            </p>
            <h2 className="text-[#181411] dark:text-gray-100 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Furniture Preview
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAYC-SWTX0rzLpdyoUB4cKpdgDZXFmkprFcW5sjAVSiTsCMvvWqBV34_QZBX0_wnSaoCsCXWqnFKh-rFBJQ8jrQk3CjP9-Dg76dmNlzk81MopkszKBl2BE0LFDq1HzwZ0IfBlfVWwOOrRjlLauqFSDNY_UMpSfSISxCJM4uIi9tkcKrXUf5ud3GVzPzRJCOJXEAbTactWmvp7G4c-bC6mwvKJxbXpyoc1aF2QeTcBz5PwaRfNNAHNTN81hiAQRi6FcT30VbmbmGdvpX")`,
                  }}
                ></div>
                <p className="text-[#181411] dark:text-gray-100 text-base font-medium leading-normal">
                  Sectional Sofa
                </p>
              </div>
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuA5ptpIR_Udh4TPfFXk5jBQdeZSw3jtrnuk6AUAUU0onKsqEuMQPqbs432-m9OMHRrgg8JAMrvEu6O7IztFcSqGF7Aopbs2-TVZRyWnV12hDDKDmg5AKQ92Vq5D-lzXBTWdFPNHOvd27XyR6_IoCtZTDKJ5UlEYknixjUgt2IeosfPfl96KOoLGNAu9ymYzUHLzuTz4QyZ6zHQ8oQvvY-eIITNZm0--1-BkVG8gk_3Vw9ZL2dhD5AST8zYdDDEaVbcYYSwrCg3AOaEN")`,
                  }}
                ></div>
                <p className="text-[#181411] dark:text-gray-100 text-base font-medium leading-normal">
                  Coffee Table
                </p>
              </div>
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl"
                  style={{
                    backgroundImage: `-moz-initialurl("https://lh3.googleusercontent.com/aida-public/AB6AXuCYTs8H8enXFIuxAvPjqXoWonS92cXK6wqT_xdimuYRLdDGLHv28w6aLzhBX1z8YLQWFYLJvRiX6tHUlCy8ct_mT5vHbhBcwco7A1LXi0TD3wGD-HcUjYAiONPAso3bl8vv-5tj2L2TotTAwWWcbIkXTEynl5W_o1XU5g14MHM92UMFcXY4oapgq8Jtg0soeqY6qOsh17CuAOk4ouZhe8M5en9_5ZRzTC-6de6dz9n1c6xT8CjhgEQGyMmEWh6GCeGV15AX7eN-mvXY")`,
                  }}
                ></div>
                <p className="text-[#181411] dark:text-gray-100 text-base font-medium leading-normal">
                  Media Console
                </p>
              </div>
              <div className="flex flex-col gap-3 pb-3">
                <div
                  className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDX0HobqCNQlB5XmKaijsz4IhWiIlamvAGd31ijIbyS-bYOQDVaOkQrlJ2Likn7jbyjSEY2EJiuGOmf10crouOEq_vEfLo-PBRRFuMeENjZux4R61J6hKfengV6L7dEgIItEBXW_xnW4cwPtqGtZu_Zh6rn8BamdpRqj_HMhfb3FjFW6WXgvvpmK9ZT1FyrI0TeKFNYhM5crHQ5lp8RyPuBTz6z3fJSNwkRBHDotqMzZFndyiVeZ1_md4IS8Ux4z-2iZ_jbmqYF3NAL")`,
                  }}
                ></div>
                <p className="text-[#181411] dark:text-gray-100 text-base font-medium leading-normal">
                  Abstract Art
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 px-4 py-2">
              <div className="flex items-center justify-center gap-2 px-3 py-2">
                <div
                  className="text-[#8a7260] dark:text-orange-300"
                  data-icon="Heart"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"></path>
                  </svg>
                </div>
                <p className="text-[#8a7260] dark:text-orange-300 text-[13px] font-bold leading-normal tracking-[0.015em]">
                  123
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 px-3 py-2">
                <div
                  className="text-[#8a7260] dark:text-orange-300"
                  data-icon="ChatCircleDots"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path>
                  </svg>
                </div>
                <p className="text-[#8a7260] dark:text-orange-300 text-[13px] font-bold leading-normal tracking-[0.015em]">
                  45
                </p>
              </div>
            </div>
            <h2 className="text-[#181411] dark:text-gray-100 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Comments
            </h2>
            <div className="flex w-full flex-row items-start justify-start gap-3 p-4">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                style={{
                  backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBGgK0Bex7RhIALWe_qecuZvY7tXIfBdUERcUa_C9jo9JCsoD8mh22V_6D1V9RMhkpmxxNF-yQ_2ZAGQ8gksHH7rYgziCiBtDSFQXynVnUDjhScQAl1W2ITByo42yECHdFLpHuItnoechtbyUNqQd6EAF4erLnHQoBovd06khQSZ9zANijyYewtjRIRyMleZe2NCSzseNNSvdZuPHGDcoDnLb8y3Pk--J00s3ogmT2TeO58giQKCe3ockyZ3rxkldqGL-tJKWWJThh8")`,
                }}
              ></div>
              <div className="flex h-full flex-1 flex-col items-start justify-start">
                <div className="flex w-full flex-row items-start justify-start gap-x-3">
                  <p className="text-[#181411] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em]">
                    Sophia Turner
                  </p>
                  <p className="text-[#8a7260] dark:text-orange-300 text-sm font-normal leading-normal">
                    2 days ago
                  </p>
                </div>
                <p className="text-[#181411] dark:text-gray-100 text-sm font-normal leading-normal">
                  This is such a beautiful and inviting space! I love the color
                  scheme and the natural light. Great job!
                </p>
              </div>
            </div>
            <div className="flex w-full flex-row items-start justify-start gap-3 p-4">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                style={{
                  backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAdIepJ1DThx-Ixb58KZdxV5JipZvZyD1v7vj__KTryuEE9VvEZ4Ij5VFcUoQwj82HJAfiGPIhmp3eUkp9Uurgoa_uUnELw-wDbuooanMVlmGVYQ9lmv6lG8B_NOtazk1ru3mR3tuTvYbs-r3AzP-fcQ-JjwaSIFeb-CqYR9xEw8DEfndZez6sINJT429G0Vmb_QOVU7aLbX0J85LlJRrlsGyVabAD4p8GqFSlikLptinax9RAVoJ6LB04_w6Mq5-X1Qer3zrnbIZvN")`,
                }}
              ></div>
              <div className="flex h-full flex-1 flex-col items-start justify-start">
                <div className="flex w-full flex-row items-start justify-start gap-x-3">
                  <p className="text-[#181411] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em]">
                    Liam Wong
                  </p>
                  <p className="text-[#8a7260] dark:text-orange-300 text-sm font-normal leading-normal">
                    3 days ago
                  </p>
                </div>
                <p className="text-[#181411] dark:text-gray-100 text-sm font-normal leading-normal">
                  I'm really impressed with the design. The layout is perfect,
                  and the furniture choices are spot on. I especially love the
                  abstract art on the walls.
                </p>
              </div>
            </div>
            <div className="flex w-full flex-row items-start justify-start gap-3 p-4">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                style={{
                  backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAa8yid93QWImX1MTObE5rmNoXrvy2rSVEUOeSpYWsqQMuCnIOMPmjK9ufbS_-Jx1nuaDSWEsKx5W76c-GrLMN5KJhHoEk4u2fzkhM8nbOimCk_s6xtBjps7WDggASCTGvSHHu7gfTcfuXT30I0kuT9p5ArMDuPwU7NQ4BgzfMNLz-r7KoXV8iFRw8UqZCTAKPxC4ShDi4-BMNR0D3GhvQNe1vGwldcTatjb1vzs2EvQORY2oGi55sEMxmZPyDbTccWHiGKWtOx5bdp")`,
                }}
              ></div>
              <div className="flex h-full flex-1 flex-col items-start justify-start">
                <div className="flex w-full flex-row items-start justify-start gap-x-3">
                  <p className="text-[#181411] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em]">
                    Emily Harper
                  </p>
                  <p className="text-[#8a7260] dark:text-orange-300 text-sm font-normal leading-normal">
                    4 days ago
                  </p>
                </div>
                <p className="text-[#181411] dark:text-gray-100 text-sm font-normal leading-normal">
                  This living room is absolutely stunning! The neutral color
                  palette with the blue and green accents is so calming and
                  elegant. I also appreciate the natural light and the overall
                  balance of the space.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
