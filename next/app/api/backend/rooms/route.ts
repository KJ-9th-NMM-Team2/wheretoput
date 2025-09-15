import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { HttpResponse } from "@/utils/httpResponse";


/**
 * @swagger
 * /api/backend/rooms:
 *   get:
 *     tags:
 *       - Chat
 *     summary: 사용자가 참여 중인 채팅방 목록 조회
 *     description: 로그인한 사용자가 참여하고 있는 채팅방 목록을 가져옵니다. 
 *                  각 채팅방에는 최근 메시지, 참가자 정보, 읽은 시각 정보 등이 포함됩니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 채팅방 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "clx123abc456"
 *                   name:
 *                     type: string
 *                     nullable: true
 *                     example: "Study Group"
 *                   creator:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "clu987xyz123"
 *                       name:
 *                         type: string
 *                         example: "Alice"
 *                   chat_messages:
 *                     type: array
 *                     description: 최근 메시지 1개만 포함
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "msg001"
 *                         content:
 *                           type: string
 *                           example: "안녕하세요!"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-09-13T12:34:56.000Z"
 *                   chat_participants:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: "clu987xyz123"
 *                         is_left:
 *                           type: boolean
 *                           example: false
 *                         custom_room_name:
 *                           type: string
 *                           nullable: true
 *                           example: "개인 스터디방"
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "clu987xyz123"
 *                             name:
 *                               type: string
 *                               example: "Alice"
 *                   last_read_at:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2025-09-13T09:00:00.000Z"
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-13T12:34:56.000Z"
 *       401:
 *         description: 인증 실패 (로그인 필요)
 *       404:
 *         description: 사용자 정보를 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chatRooms = await prisma.chat_rooms.findMany({
      where: {
        chat_participants: {
          some: {
            user_id: user.id,
            is_left: { not: true }, // 나가지 않은 채팅방만
          },
        },
      },
      include: {
        chat_messages: {
          orderBy: {
            created_at: "desc",
          },
          take: 1,
        },
        chat_participants: {
          include: {
            user: true,
          },
        },
        creator: true,
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    // 각 방에 대해 현재 사용자의 last_read_at 추가
    const roomsWithReadStatus = Array.isArray(chatRooms) ? chatRooms.map((room) => {
      const myParticipant = room.chat_participants.find(
        (p) => p.user_id === user.id
      );
      return {
        ...room,
        last_read_at: myParticipant?.last_read_at || null,
        custom_room_name: myParticipant?.custom_room_name || null,
      };
    }) : [];

    // console.log("반환:", roomsWithReadStatus);
    return NextResponse.json(roomsWithReadStatus);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return HttpResponse.internalError("Failed to fetch chat rooms");
  }
}
