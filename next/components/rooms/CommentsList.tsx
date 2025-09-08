"use client";
import {
  fetchPostComment,
  fetchEditComment,
  fetchDeleteComment,
} from "@/lib/api/comments";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function CommentCard({
  comment,
  currentUserId,
}: {
  comment: any;
  currentUserId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 현재 사용자가 댓글 작성자인지 확인

  const isOwner = currentUserId === comment.user_id;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEdit = async () => {
    if (!editContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchEditComment(comment.comment_id, editContent);
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("댓글 수정에 실패했습니다.");
      }
    } catch (error) {
      alert("댓글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchDeleteComment(comment.comment_id);
      if (result.success) {
        router.refresh();
      } else {
        alert("댓글 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex w-full flex-row items-start justify-start gap-3 p-4 transition-opacity ${
        isLoading ? "opacity-70" : ""
      }`}
    >
      <Link href={`/users/${comment.user.id}`}>
        {comment.user.image ? (
          <img
            src={comment.user.image}
            alt={comment.user.name}
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 
        transition-all duration-200 hover:scale-110 hover:ring-4 cursor-pointer
        ring-amber-200 hover:ring-amber-300
        dark:ring-gray-600 dark:hover:ring-amber-400"
          />
        ) : (
          <span className="text-xl font-bold text-amber-700 dark:text-orange-200">
            {comment.user.name?.[0]?.toUpperCase() || "?"}
          </span>
        )}
      </Link>

      <div className="flex h-full flex-1 flex-col items-start justify-start">
        <div className="flex w-full flex-row items-start justify-between">
          <div className="flex flex-row items-start justify-start gap-x-3">
            <p className="text-[#181411] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em]">
              {comment.user.name}
            </p>
            <p className="text-[#8a7260] dark:text-orange-300 text-sm font-normal leading-normal">
              {new Date(comment.created_at).toLocaleDateString()}{" "}
              {new Date(comment.created_at).toLocaleTimeString()}
            </p>
          </div>
          {isOwner && (
            <div className="relative" ref={dropdownRef}>
              <button
                className="text-[#8a7260] dark:text-orange-300 hover:text-[#181411] dark:hover:text-gray-100 p-1"
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isLoading}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 9a1 1 0 100-2 1 1 0 000 2zM8 4a1 1 0 100-2 1 1 0 000 2zM8 14a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-1 w-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
                  <button
                    className="block w-full px-3 py-2 text-left text-sm text-[#181411] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setIsEditing(true);
                      setShowDropdown(false);
                    }}
                    disabled={isLoading}
                  >
                    수정
                  </button>
                  <button
                    className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
                    onClick={() => {
                      setShowDropdown(false);
                      handleDelete();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <div className="animate-spin h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full"></div>
                    )}
                    {isLoading ? "삭제중..." : "삭제"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="w-full mt-2">
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 dark:bg-gray-800 dark:text-gray-100"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex gap-2 mt-2">
              <button
                className={`px-3 py-1 text-xs font-bold text-white rounded flex items-center gap-1 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-400 hover:bg-orange-500"
                }`}
                onClick={handleEdit}
                disabled={isLoading}
              >
                {isLoading && (
                  <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                {isLoading ? "수정중..." : "수정"}
              </button>
              <button
                className="px-3 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isLoading}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <p className="text-[#181411] dark:text-gray-100 text-sm font-normal leading-normal flex-1">
              {comment.content}
            </p>
            {isLoading && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="animate-spin h-3 w-3 border-2 border-orange-400 border-t-transparent rounded-full"></div>
                <span>처리중...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsList({
  room_comments,
  currentUserId,
}: {
  room_comments: any[];
  currentUserId?: string;
}) {
  const [commentInput, setCommentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!commentInput.trim()) {
      alert("댓글을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchPostComment(
        params.id as string,
        session.user.id,
        commentInput
      );
      if (result.success) {
        setCommentInput("");
        router.refresh();
      } else {
        alert("댓글 등록에 실패했습니다.");
      }
    } catch (error) {
      alert("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 p-4">
      <form className="mb-4 flex flex-row gap-2" onSubmit={handleSubmit}>
        <textarea
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 dark:bg-gray-800 dark:text-gray-100"
          placeholder="댓글을 입력하세요"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`rounded px-4 py-2 text-sm font-bold text-white flex items-center gap-2 min-w-[80px] justify-center ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-400 hover:bg-orange-500"
          }`}
          disabled={isLoading}
        >
          {isLoading && (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          )}
          {isLoading ? "등록중..." : "등록"}
        </button>
      </form>
      <div className="flex flex-col gap-1">
        {room_comments.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </div>
        ) : (
          room_comments.map((c) => (
            <CommentCard
              key={c.comment_id}
              comment={c}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}
