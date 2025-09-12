import { getColab, toggleColab } from "@/lib/api/toggleColab";
import { api } from "@/lib/client/api";

export interface CollaborationAccessResult {
  success: boolean;
  roomId?: string;
  accessDenied?: boolean;
  error?: string;
}

export interface CollaborationAccessParams {
  currentRoomId: string;
  isOwner: boolean;
}

export interface ChatRoomSetupResult {
  success: boolean;
  selectedChatId?: string;
  error?: string;
}

export interface ChatRoomSetupParams {
  currentRoomId: string;
  isOwner: boolean;
  userId?: string;
  currentRoomInfo?: { title?: string } | null;
}

/**
 * 협업 모드 접근 권한만 체크하는 함수 (최적화됨)
 */
export async function checkCollaborationAccess({
  currentRoomId,
  isOwner,
}: CollaborationAccessParams): Promise<CollaborationAccessResult> {
  try {
    // 협업 상태 확인 (방장/비방장 공통)
    const collabResult = await getColab(currentRoomId);

    if (!collabResult.success) {
      return {
        success: false,
        accessDenied: true,
        error: "협업 상태 확인 실패",
      };
    }

    if (isOwner) {
      // 방장인 경우 - 협업 모드가 꺼져있으면 켜기
      if (!collabResult.data.collab_on) {
        // 협업 모드가 꺼져있으면 자동으로 켜기
        const toggleResult = await toggleColab(currentRoomId, true);
        if (!toggleResult.success) {
          return {
            success: false,
            accessDenied: true,
            error: "협업 모드 활성화 실패",
          };
        }
      }

      return {
        success: true,
        roomId: currentRoomId,
      };
    } else {
      // 방장이 아닌 경우 - 협업 모드 상태만 확인
      if (!collabResult.data.collab_on) {
        // 협업 모드 꺼진 경우 접근 거부
        return {
          success: false,
          accessDenied: true,
          error: "협업 모드가 비활성화되어 있습니다",
        };
      }

      return {
        success: true,
        roomId: currentRoomId,
      };
    }
  } catch (error) {
    return {
      success: false,
      accessDenied: true,
      error: "협업 모드 접근 권한 체크 실패",
    };
  }
}

/**
 * 채팅방 설정 처리 함수 (소켓 연결 후 호출)
 */
export async function setupChatRoom({
  currentRoomId,
  isOwner,
  userId,
  currentRoomInfo,
}: ChatRoomSetupParams): Promise<ChatRoomSetupResult> {
  try {
    if (isOwner) {
      // 방장인 경우 - 채팅방 생성 또는 참가
      try {
        const joinResponse = await api.post(
          `${process.env.NEXT_PUBLIC_API_URL}/rooms/collab/${currentRoomId}/join`,
          {}
        );

        if (joinResponse.data.chatRoom) {
          return {
            success: true,
            selectedChatId: joinResponse.data.chatRoom.chat_room_id,
          };
        } else {
          // 채팅방이 없는 경우 새로 생성
          console.log("채팅방 생성 이름:", currentRoomInfo);
          const response = await api.post(
            `${process.env.NEXT_PUBLIC_API_URL}/rooms/group`,
            {
              participantIds: [],
              simRoomId: currentRoomId,
            }
          );

          return {
            success: true,
            selectedChatId: response.data.chat_room_id,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: "협업 채팅방 처리 실패",
        };
      }
    } else {
      // 방장이 아닌 경우 - 채팅방 참가 시도
      if (!userId) {
        return {
          success: true, // 로그인하지 않은 사용자는 채팅방 없이 진행
        };
      }

      try {
        const joinResponse = await api.post(
          `${process.env.NEXT_PUBLIC_API_URL}/rooms/collab/${currentRoomId}/join`,
          {}
        );

        if (joinResponse.data.joined && joinResponse.data.chatRoom) {
          return {
            success: true,
            selectedChatId: joinResponse.data.chatRoom.chat_room_id,
          };
        } else {
          return {
            success: true, // 채팅방이 없어도 성공으로 처리
          };
        }
      } catch (error) {
        return {
          success: true, // 채팅방 참가 실패해도 협업은 계속 진행
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: "채팅방 설정 실패",
    };
  }
}
