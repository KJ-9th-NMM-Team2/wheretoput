// Simulation page
// Team: 수연, 성진
interface SimPageProps {
  params: Promise<{ id: string }>;
}

export default async function SimPage({ params }: SimPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">시뮬레이션</h1>
      <p>시뮬레이션 ID: {id}</p>
      <p>시뮬레이션 실행 페이지입니다.</p>
    </div>
  );
}