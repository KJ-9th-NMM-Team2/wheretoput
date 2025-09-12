const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

type ToggleResult = {
  success: boolean;
  data?: any;
  error?: string;
};

// GET  /api/rooms/{id}/collaboration: 협업 모드 여부 확인
export async function getColab(room_id: string): Promise<ToggleResult> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/rooms/${room_id}/collaboration`,
      {
        method: "GET",
        cache: "no-store",
      }
    );
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

// PATCH  /api/rooms/{id}/collaboration: 협업 모드 토글
export async function toggleColab(
  room_id: string,
  collab_on: boolean
): Promise<ToggleResult> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/rooms/${room_id}/collaboration`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collab_on }),
        cache: "no-store",
      }
    );

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
