const SideSearch = ({collapsed}:{collapsed:boolean}) => {
    return <>
        {/* Search */}
        <div className="flex-shrink-0"> {/* 크기 고정 */}
          {!collapsed && (
            <div className="p-4 border-b border-gray-300">
              <input
                type="text"
                placeholder="가구를 검색해보세요..."
                className="w-full px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-300 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
    </>
}

export default SideSearch;