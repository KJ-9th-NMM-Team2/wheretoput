import { fetchRooms } from "@/lib/api/rooms";
import SortedHouseList from "@/components/community/SortedHouseList";

export default async function CommunityPage(): Promise<React.JSX.Element> {
  // GET "/api/rooms" -> 집 데이터 가져오는 함수
  const data: any[] = await fetchRooms();
  return <SortedHouseList data={data} />;
}
