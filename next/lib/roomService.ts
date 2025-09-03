// 방 정보 관련 서비스 함수들

export interface RoomInfo {
  title: string;
  description: string;
  is_public: boolean;
}

/**
 * DB에서 방 정보를 가져오는 함수
 * @param roomId 방 ID
 * @returns 방 정보 객체
 */
export async function fetchRoomInfo(roomId: string): Promise<RoomInfo> {
  // 임시 방인 경우 기본값 반환
  if (!roomId || roomId.startsWith('temp_')) {
    return {
      title: "새로운 방",
      description: "",
      is_public: false
    };
  }

  try {
    const response = await fetch(`/api/rooms/${roomId}`);
    
    if (response.ok) {
      const roomData = await response.json();
      return {
        title: roomData.title || "",
        description: roomData.description || "",
        is_public: roomData.is_public || false
      };
    } else {
      console.error('방 정보 가져오기 실패:', response.statusText);
      return {
        title: "방 정보 없음",
        description: "",
        is_public: false
      };
    }
  } catch (error) {
    console.error('방 정보 가져오기 오류:', error);
    return {
      title: "오류 발생",
      description: "",
      is_public: false
    };
  }
}

/**
 * 방 정보를 업데이트하는 함수
 * @param roomId 방 ID
 * @param roomInfo 업데이트할 방 정보
 * @returns 성공 여부
 */
export async function updateRoomInfo(
  roomId: string, 
  roomInfo: RoomInfo
): Promise<boolean> {
  // 임시 방인 경우 저장하지 않음
  if (!roomId || roomId.startsWith('temp_')) {
    console.log('임시 방은 저장할 수 없습니다');
    return false;
  }

  try {
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomInfo)
    });

    if (response.ok) {
      console.log('방 정보 업데이트 성공');
      return true;
    } else {
      console.error('방 정보 업데이트 실패:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('방 정보 업데이트 오류:', error);
    return false;
  }
}

/**
 * 방을 삭제하는 함수
 * @param roomId 방 ID
 * @returns 성공 여부
 */
export async function deleteRoom(roomId: string): Promise<boolean> {
  // 임시 방인 경우 삭제하지 않음
  if (!roomId || roomId.startsWith('temp_')) {
    console.log('임시 방은 삭제할 수 없습니다');
    return false;
  }

  // 사용자 확인
  if (!confirm('정말로 이 방을 삭제하시겠습니까?')) {
    return false;
  }

  try {
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      console.log('방 삭제 성공');
      // 메인 페이지로 리다이렉트
      window.location.href = '/';
      return true;
    } else {
      console.error('방 삭제 실패:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('방 삭제 오류:', error);
    return false;
  }
}