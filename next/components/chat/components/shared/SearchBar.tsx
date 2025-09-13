// 공통 검색바 컴포넌트
// 채팅방 검색과 사용자 검색에 공통으로 사용

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function SearchBar({ value, onChange, onClear, placeholder = "검색", onFocus, onBlur }: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="m-2 flex items-center rounded-full bg-[rgba(255,255,255,1)] px-4 py-2 shadow-sm border border-gray-300 focus-within:border-blue-400"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        className="mr-2 opacity-70 text-black-500"
      >
        <path
          d="M21 20l-4.35-4.35m1.1-4.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="bg-transparent outline-none w-full text-[15px] placeholder:text-[#9aa4b2]"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="ml-2 text-sm text-gray-500 hover:text-gray-700"
          aria-label="검색어 지우기"
        >
          ✕
        </button>
      )}
    </form>
  );
}