// Main page
// Team: 상록
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">WhereToput</h1>
          <p className="text-lg text-gray-600">공간 배치 최적화 플랫폼</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Link href="/community" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">커뮤니티</h2>
            <p className="text-gray-600">사용자들과 아이디어를 공유하세요</p>
          </Link>

          <Link href="/create" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">도면 생성</h2>
            <p className="text-gray-600">새로운 공간 배치 도면을 만들어보세요</p>
          </Link>

          <Link href="/search" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">검색</h2>
            <p className="text-gray-600">원하는 배치 방식을 찾아보세요</p>
          </Link>

          <Link href="/chat" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">채팅</h2>
            <p className="text-gray-600">실시간으로 소통하세요</p>
          </Link>

          <Link href="/follows" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">팔로우</h2>
            <p className="text-gray-600">관심있는 사용자를 팔로우하세요</p>
          </Link>

          <Link href="/setting" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">설정</h2>
            <p className="text-gray-600">계정 및 앱 설정을 관리하세요</p>
          </Link>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500">
            새로운 기능들이 계속 추가될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
