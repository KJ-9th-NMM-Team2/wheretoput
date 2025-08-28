// Test용
import SimSideView from "../../components/sim/SimSideView"
// import BedroomPage from "../../bedroom/page"


// 시뮬레이터 페이지 - 수연, 성진
// app\sim\[id]\page.tsx 에 있어야 합니다.
export default async function SimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;  // /pages/[id]에 해당하는 id 값
  // return <div>current sim {id}</div>

  return (
  <>
    <SimSideView></SimSideView>
  </>
  )
}
