import { useEffect, useState } from "react";

const SideSearch = ({
  collapsed, 
  onSearchResults,
  resetQuery,
}: {
  collapsed: boolean;
  onSearchResults?: (results: any[], loading: boolean) => void;
  resetQuery?: string;
}) => {
    const [query, setQuery] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!searchQuery.trim()) {
        // setResults([]);
        onSearchResults?.([], false);
        return;
      }
      
      const searchData = async () => {
        setLoading(true);
        onSearchResults?.([], true);
        
        try {
          const response = await fetch(`/api/sim/search?query=${searchQuery}`);
          if (response.ok) {
            const data = await response.json();
            // setResults(data);
            onSearchResults?.(data, false);
          } else {
            console.error("Search API error:", response.statusText);
            onSearchResults?.([], false);
          }
        } catch (error) {
          console.error("Fetch error:", error);
          onSearchResults?.([], false);
        } finally {
          setLoading(false);
        }
      }

      searchData();
    }, [searchQuery]); // onSearchResults 제거!

    useEffect(() => {
      setQuery(resetQuery || "");
      setSearchQuery(resetQuery || "");
    }, [resetQuery])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        setSearchQuery(query);
      }
    };

    return <>
        <div className="flex-shrink-0">
          {!collapsed && (
            <div className="p-4 border-b border-gray-300">
              <input
                type="text"
                placeholder="가구 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown} // 수정: () => 제거
                className="w-full px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-300 dark:text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {loading && <div className="text-sm text-gray-500 mt-2">검색 중...</div>}
            </div>
          )}
        </div>
    </>
}

export default SideSearch;