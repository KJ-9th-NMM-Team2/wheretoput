// Room detail page
// Team: 상록
interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">룸 상세 정보</h1>
      <p>룸 ID: {id}</p>
      <p>특정 룸의 상세 정보 페이지입니다.</p>
    </div>
  );
}