import { useEffect, useState } from "react";

interface SideSearchProps {
  collapsed: boolean;
  resetQuery?: string;
  searchQuery: string;
  selectedCategory: string | null;
  page: number;
  itemsPerPage: number;
  loading: boolean;
  setPage: (page: number) => void;
  setTotalItems: (totalItems: number) => void;
  setLoading: (loading: boolean) => void;
  setSearchResults: (results: any[]) => void;
  setSearchQuery: (query: string) => void;
}

const SideSearch = ({
  collapsed,
  resetQuery,
  searchQuery,
  selectedCategory,
  itemsPerPage,
  loading,
  setPage,
  setTotalItems,
  setLoading,
  setSearchResults,
  setSearchQuery
}: SideSearchProps) => {
    const [query, setQuery] = useState("");

    useEffect(() => {
      if (!searchQuery.trim()) {
        return;
      }
      
      const searchData = async () => {
        setLoading(true);
        
        try {
          const response = await fetch(`/api/sim/search?query=${searchQuery}&category=${selectedCategory}&page=1&limit=${itemsPerPage}`);
          if (response.ok) {
            const data = await response.json();
            console.log("data check", data);
            setSearchResults(data['items']);
            setPage(data['pagination']['currentPage']);
            setTotalItems(data['pagination']['totalItems']);
          } else {
            console.error('Search API error:', response.status, response.statusText);
          }
        } catch (error) {
          console.error("Fetch error:", error);
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
                onKeyDown={(e) => {
                  handleKeyDown(e);
                  e.stopPropagation();
                }} 
                className="w-full px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-300 dark:text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {loading && <div className="text-sm text-gray-500 mt-2">검색 중...</div>}
            </div>
          )}
        </div>
    </>
}

export default SideSearch;