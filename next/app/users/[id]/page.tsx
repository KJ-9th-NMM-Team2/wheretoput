// 사용자 정보 페이지 - 상록
export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;  // /pages/[id]에 해당하는 id 값
  return <h1>사용자 정보 페이지 - id {id}</h1>;
}
