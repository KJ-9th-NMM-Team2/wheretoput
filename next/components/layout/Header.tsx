import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900">
              WhereToput
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/community" className="text-gray-600 hover:text-gray-900">
              커뮤니티
            </Link>
            <Link href="/create" className="text-gray-600 hover:text-gray-900">
              도면 생성
            </Link>
            <Link href="/search" className="text-gray-600 hover:text-gray-900">
              검색
            </Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            <Link href="/chat" className="text-gray-600 hover:text-gray-900">
              채팅
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}