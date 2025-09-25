"use client";

export default function SearchBar({
  searchInput,
  setSearchInput,
  onSearch,
  setSortType,
}: {
  searchInput: string;
  setSearchInput: (input: string) => void;
  onSearch: (input: string) => void;
  setSortType: (type: "view" | "new" | "like") => void;
}) {
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log("key down enter")
      onSearch(searchInput);
      setSortType("view");
    }
  }

  const handleXBox = () => {
    setSearchInput("");
  }
  return (
    <div className="px-4 py-3" style={{ backgroundColor: 'var(--background)' }}>
      <label className="flex flex-col min-w-40 h-12 max-w-md mx-auto">
        <div className="flex w-full flex-1 items-stretch rounded-full h-full shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200">
          <div
className="text-gray-500 dark:text-gray-400 flex items-center justify-center pl-4 rounded-l-full"
            style={{ backgroundColor: 'var(--background)' }}
            data-icon="MagnifyingGlass"
            data-size="24px"
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
className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-full focus:outline-none border-none h-full px-4 text-sm font-normal leading-normal transition-all duration-200 text-gray-900 placeholder:text-gray-500 dark:text-gray-100 dark:placeholder:text-gray-400"
            style={{ backgroundColor: 'var(--background)' }}
            onChange={(e) => {
              setSearchInput(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            value={searchInput}
            placeholder="유저 이름 혹은 방 이름을 입력하세요."
          />
<div className="flex items-center justify-center rounded-r-full pr-4" style={{ backgroundColor: 'var(--background)' }}>
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-transparent text-gray-900 dark:text-gray-100 gap-2 text-base font-bold leading-normal tracking-[0.015em] h-auto min-w-0 px-0"
              onClick={handleXBox}
            >
              <div
                className="text-gray-500 dark:text-gray-400"
                data-icon="XCircle"
                data-size="24px"
                data-weight="regular"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20px"
                  height="20px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </label>
    </div>
  );
}
