// 채팅방 나가기 API
// 사용자별로 채팅방을 숨김 처리 (카카오톡처럼)

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    
    // JWT 토큰에서 사용자 ID 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId || decoded.id;
    } catch (error) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 401 }
      );
    }

    console.log('🔍 채팅방 나가기 요청:', { roomId, userId });

    // 채팅방 정보 확인 (생성자인지 확인)
    const chatRoom = await prisma.chat_rooms.findUnique({
      where: { chat_room_id: roomId },
      select: { creator_id: true }
    });

    console.log('🏠 채팅방 정보:', chatRoom);

    // 참가자 정보 확인
    const participant = await prisma.chat_participants.findUnique({
      where: {
        chat_room_id_user_id: {
          chat_room_id: roomId,
          user_id: userId,
        },
      },
    });

    console.log('👤 참가자 조회 결과:', participant);

    // 생성자이거나 참가자여야 나갈 수 있음
    const isCreator = chatRoom?.creator_id === userId;
    const isParticipant = !!participant;

    console.log('🔍 권한 확인:', { isCreator, isParticipant, userId, creatorId: chatRoom?.creator_id });

    if (!isCreator && !isParticipant) {
      // 디버깅: 해당 채팅방의 모든 참가자 조회
      const allParticipants = await prisma.chat_participants.findMany({
        where: { chat_room_id: roomId },
        include: { user: { select: { id: true, name: true, email: true } } }
      });
      console.log('👥 채팅방의 모든 참가자:', allParticipants);

      return NextResponse.json(
        { 
          error: "채팅방 접근 권한이 없습니다",
          debug: {
            roomId,
            userId,
            isCreator,
            isParticipant,
            creatorId: chatRoom?.creator_id,
            allParticipants: allParticipants.map(p => ({
              user_id: p.user_id,
              user_name: p.user?.name,
              user_email: p.user?.email
            }))
          }
        },
        { status: 404 }
      );
    }

    // 채팅방 나가기 처리
    if (isParticipant) {
      // 참가자인 경우: 참가자 테이블에서 제거
      await prisma.chat_participants.delete({
        where: {
          chat_room_id_user_id: {
            chat_room_id: roomId,
            user_id: userId,
          },
        },
      });
    } else if (isCreator) {
      // 생성자인 경우: 참가자 관계가 없으므로 로직 스킵
      console.log('💡 생성자가 채팅방을 나가는 요청 - 참가자 테이블 수정 없이 진행');
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "채팅방에서 나갔습니다",
        roomId,
        userId 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("채팅방 나가기 처리 중 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}