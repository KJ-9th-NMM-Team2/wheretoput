// API 클라이언트 함수들

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

type LikeResult = {
  success: boolean;
  data?: any;
  error?: string;
};

// POST /api/likes (좋아요 달기/취소)
export async function fetchPostLike(
  room_id: string,
  user_id: string
): Promise<LikeResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/likes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room_id, user_id }),
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }

    const error = await response.text();
    return { success: false, error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// GET /api/likes (좋아요 여부 확인하기)
export async function fetchLike(
  room_id: string,
  user_id: string
): Promise<{ liked: boolean }> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/likes?room_id=${room_id}&user_id=${user_id}`,
      { cache: "no-store" }
    );

    if (response.ok) {
      return await response.json();
    }

    return { liked: false };
  } catch (error) {
    console.error("Error fetching like status:", error);
    return { liked: false };
  }
}
