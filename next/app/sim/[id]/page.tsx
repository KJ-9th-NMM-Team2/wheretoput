// 시뮬레이터 페이지 - 수연, 성진
// app\sim\[id]\page.tsx 에 있어야 합니다.
export default async function SimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;  // /pages/[id]에 해당하는 id 값
  return <h1>시뮬레이터 페이지 - id {id}</h1>;
}
