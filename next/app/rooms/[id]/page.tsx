// 방 상세 정보 페이지 - 상록
export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // /pages/[id]에 해당하는 id 값
  return <div>방 상세정보 페이지 - id {id}</div>;
}
