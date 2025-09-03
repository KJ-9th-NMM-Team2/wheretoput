export interface HouseSummary {
  room_id: string;
  user_id: string;
  display_name: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  view_count?: number;
  num_likes?: number;
  num_comments?: number;
}
