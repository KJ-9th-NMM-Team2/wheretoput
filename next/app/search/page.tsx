import SortedHouseList from "@/components/search/SortedHouseList";
import { fetchRooms } from "@/lib/api/rooms";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<React.JSX.Element> {
  // GET "/api/rooms" -> 집 데이터 가져오는 함수
  let data: any[] = [];
  let searchMode = false;
  const params = await searchParams; // Next.js 15부터 이렇게 await 해야 한다고 한다.
  const query = params.q;

  if (!query || query.trim() === "") {
    data = await fetchRooms();
  } else {
    searchMode = true;
    data = await fetchRooms(undefined, undefined, undefined, query);
    console.log(data);
  }
  return (
    <>
      <SortedHouseList data={data} initQuery={query || ""} />
    </>
  );
}
