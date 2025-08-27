// User profile page
// Team: 상록
interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">사용자 프로필</h1>
      <p>사용자 ID: {id}</p>
      <p>사용자 프로필 페이지입니다.</p>
    </div>
  );
}