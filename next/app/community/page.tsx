// 커뮤니티 페이지 - 상록

export default function CommunityPage() {
  return (
    <>
      <div className="px-40 py-5">
        <div className="flex gap-3 p-3 flex-wrap pr-4">
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-amber-50 dark:bg-orange-600 pl-4 pr-4 hover:bg-amber-100 dark:hover:bg-orange-700 transition-colors duration-200">
            <span className="text-sm">Most Popular</span>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-amber-50 dark:bg-orange-600 pl-4 pr-4 hover:bg-amber-100 dark:hover:bg-orange-700 transition-colors duration-200">
            <span className="text-sm">Newest</span>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-amber-50 dark:bg-orange-600  pl-4 pr-4 hover:bg-amber-100 dark:hover:bg-orange-700 transition-colors duration-200">
            <span className="text-sm">Top Rated</span>
          </button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
          <div className="flex flex-col gap-3 pb-3">
            <div
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBDqTkZ62r1PyCCpgHxwtAkBJtHRQoEQoYyVp9LaR_sgUyzenJVbDj_4SPl1ttrJfmteJ9ZAsikkg9YuLHEXQakpV_HjOVn7Hty5GU3jQlq1jjEyxyod_BbQFNWtg3UQ6qHZhu32ITEj1SP7_5XCioSrvfwqDZKcgCsBKuDJPNfp3Jpf7MqFUCKMMwQFe1yBO5-hXLnD_Tq_KOrBuRSoAGKIoGz7qJ6jWpjNuwZV1lAGEucsp23IhYpxF7LnP0tutg3zNF6Y5yjBEE")`,
              }}
            ></div>
            <div>
              <p className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">
                Interactive Physics Lab
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                By: Alex Turner
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                👍 120 💬 35
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 pb-3">
            <div
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuC5Fu-QOCLcteUeXJ78bQXDGJdmguc3HNoDIWpU66AeTWsTWspbJpzrxEDourin7O2mOFbBNvdSm6xG46eUhr029PQaE4CZwtkIWOdE4Y96eBfTHE8cIH7_X3DPQX2b4EBfPK6FLByDpNDWwa83o1yohJrJKsQ0SgucyDmlf3s5GzRBYVtS3qtaBZnmHTJrlxpDVCZmAqgHD84nx10PJ8cFWeSE8kHzRmCCX9t9vBz1NsvO7ua4vZGee1FcUYWJTj0Z-pA9F1SSHZo")`,
              }}
            ></div>
            <div>
              <p className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">
                Virtual Chemistry Set
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                By: Olivia Chen
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                👍 85 💬 22
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 pb-3">
            <div
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuB4kcFdG54vjGWW8OEyBQyUl07Cy9fl9FmoUsv9NqOxgvruQGNUDGRqh-IRb2loNnOaz_ifln2H5pkQnyHXrPkJKLKh0eR1P3iokUqmnuOsT_FHtI9ll2uBzSAB6RAm7HWZBHO4QG7DyY6xj2JwpLrT3xo91-fBbXH0qddxoQ1aVpaMoybt5c59n9pObFZgeOv_DNnry5IU5JqEoH7Ozbg9KQiKZpqR4e3NEWo9v0LRGRUaIs7RxcEkhW2soHzst5XSj3GMh5Nn12w")`,
              }}
            ></div>
            <div>
              <p className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">
                Eco-System Simulator
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                By: Ethan Ramirez
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                👍 150 💬 50
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 pb-3">
            <div
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDgN6lNEJsx1Z3HEQ5Ghx1GKp6iUxHJdO_WOQJLtxP3kphkvvrBBEtSSxgloB30-gsbwm6Mw_2eIcPZObtH51Cd2eq7N7N7sKvXK04j0T4KlVlM8MgwZWvYAqoSu5UIjxlTa6wr46G_JqETdbyR_8fuNnb3LPyXXxJd7huCOFxBYdhWxUgztElk4PAZIEdxt6V_tnkydjsVPadtH8wFlNX3x_rFh6LZr7QWWoqYn1MHnDUcrT6RlmyzihDQFWz2RRkGuKimzClR_8E")`,
              }}
            ></div>
            <div>
              <p className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">
                Financial Market Simulation
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                By: Sophia Walker
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                👍 95 💬 18
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 pb-3">
            <div
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDlBZNywtIvx741Bsb_67dcArpz2mxEDBZEU_upI-Qmt08uXRFScbq7v9aTaERIagT-weUDXFvHqd5d8a2QuYHADvq0oBsoE3tUMDxpKrbDQF5lF1stRIRrGC4JbUdr_MA6ujGIXK8xxsh9W3dqb1K1XmHF63o7hiJltdTHt0VjcG4Fffh1xssjNc0X3OphBPMhRm47tR0zuw6Am5-vVayJqAn6LZqn3nHvH9CpWPuT1yHLzkibxhMjywdOYv744yrFPTkfiA49eDY")`,
              }}
            ></div>
            <div>
              <p className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">
                Traffic Flow Analysis
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                By: Noah Carter
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                👍 110 💬 42
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 pb-3">
            <div
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCJmZ_ur7gMjMPqGd4ZrLX3x5GGKlU_5eeMQENLzs2vHpAGbLaAJjENG3ez-vofVyR1dcMN6-Ge1_2M4rH0rxTN_IBOEkcExnoFf287kAwTlSfn4AGT1lTqDdTQQYQ8q-6hUkhl_Vo9sktg1FA-gMhzeNPRKK1Xsv5yYfZYZN_oLh8jZBozTAZYA10qd72fj8STgi5eO4wzshl7TnBf9Npem0Km2gk7FBdTHuhF5NXZi6NsO3FEwdETmpPsSGx_Svwy8EQ0qQ8Tt5k")`,
              }}
            ></div>
            <div>
              <p className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">
                Weather Pattern Predictor
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                By: Ava Bennett
              </p>
              <p className="text-amber-700 dark:text-orange-300 text-sm font-normal leading-normal">
                👍 75 💬 15
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
