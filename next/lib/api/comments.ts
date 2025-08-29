// POST /api/comments (코멘트 작성)

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function fetchPostComment(
  room_id: string,
  user_id: string,
  content: string
): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room_id, user_id, content }),
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

// PUT /api/comments/[id] (코멘트 수정)
export async function fetchEditComment(
  comment_id: string,
  content: string
): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/comments/${comment_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
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

// DELETE /api/comments/[id] (코멘트 삭제)
export async function fetchDeleteComment(comment_id: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/comments/${comment_id}`, {
      method: "DELETE",
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
