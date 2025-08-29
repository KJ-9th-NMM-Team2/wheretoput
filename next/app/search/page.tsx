import { fetchRooms } from "@/lib/api/rooms";
import SortedHouseList from "@/components/search/SortedHouseList";

export default async function SearchPage(): Promise<React.JSX.Element> {
  // GET "/api/rooms" -> 집 데이터 가져오는 함수
  const data: any[] = await fetchRooms();
  return (
    <>
      <SortedHouseList data={data} />
    </>
  );
}
