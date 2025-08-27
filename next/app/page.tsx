
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-900 mb-4">🏠 어따놀래</h1>
        <p className="text-xl text-blue-700 mb-8">차세대 3D 인테리어 시뮬레이터</p>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          누구나 쉽게, 내 공간을 직접 디자인하고 전 세계 사람들과 아이디어를 공유하는 플랫폼
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/bedroom" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            🛏️ 3D 침실 시뮬레이터 시작하기
          </Link>
          
          <div className="text-sm text-gray-500 mt-4">
            <p>✨ AI 가구 모델링 | 🎨 실시간 3D 렌더링 | 💬 커뮤니티 공유</p>
          </div>
        </div>
      </div>
    </div>
  );
}
