import Link from 'next/link';

export default function Navigation() {
  const navigationItems = [
    { href: '/', label: '홈' },
    { href: '/community', label: '커뮤니티' },
    { href: '/create', label: '도면 생성' },
    { href: '/search', label: '검색' },
    { href: '/follows', label: '팔로우' },
    { href: '/setting', label: '설정' },
  ];

  return (
    <nav className="bg-gray-50 border-r h-full min-h-screen w-64 p-4">
      <div className="space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}