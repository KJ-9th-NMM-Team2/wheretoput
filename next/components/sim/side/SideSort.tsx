import React, { useState } from 'react';

interface SideSortProps {
  collapsed: boolean;
  onSortChange: (sortValue: string) => void;
  currentSort: string;
}

const SideSort: React.FC<SideSortProps> = ({ collapsed, onSortChange, currentSort }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: 'updated_desc', label: '최신순' },
    { value: 'price_asc', label: '가격 낮은순' },
    { value: 'price_desc', label: '가격 높은순' },
  ];

  const currentOption = sortOptions.find(option => option.value === currentSort) || sortOptions[0];

  const handleSortChange = (sortValue: string) => {
    onSortChange(sortValue);
    setIsOpen(false);
  };

  if (collapsed) {
    return null;
  }

  return (
    <div className="flex-shrink-0 border-b border-gray-300">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-600 ">정렬</h3>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between transition-all duration-200 cursor-pointer"
          >
            <span>{currentOption.label}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors duration-200 cursor-pointer ${
                    currentSort === option.value 
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideSort;