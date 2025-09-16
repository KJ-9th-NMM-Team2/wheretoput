import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { HttpResponse } from "@/utils/httpResponse";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/backend/rooms/direct:
 *   post:
 *     tags:
 *       - Chat
 *     summary: 1:1 채팅방 생성 또는 조회
 *     description: 두 사용자 간의 1:1 채팅방을 생성하거나 기존 채팅방을 반환합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentUserId
 *               - otherUserId
 *             properties:
 *               currentUserId:
 *                 type: string
 *                 description: 현재 사용자 ID
 *                 example: "clx123abc456"
 *               otherUserId:
 *                 type: string
 *                 description: 채팅 상대방 사용자 ID
 *                 example: "clu987xyz123"
 *     responses:
 *       200:
 *         description: 1:1 채팅방 생성/조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat_room_id:
 *                   type: string
 *                   description: 채팅방 ID
 *                   example: "clx123abc456"
 *                 name:
 *                   type: string
 *                   description: 채팅방 이름 (상대방 이름)
 *                   example: "Alice"
 *                 is_private:
 *                   type: boolean
 *                   description: 1:1 채팅방 여부
 *                   example: true
 *       400:
 *         description: 잘못된 요청 (필수 파라미터 누락)
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentUserId, otherUserId } = await request.json();

    if (!currentUserId || !otherUserId) {
      return NextResponse.json(
        { error: "currentUserId and otherUserId are required" },
        { status: 400 }
      );
    }

    if (currentUserId === otherUserId) {
      return NextResponse.json(
        { error: "Cannot create chat room with yourself" },
        { status: 400 }
      );
    }

    // 두 사용자가 모두 존재하는지 확인
    const [currentUser, otherUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUserId } }),
      prisma.user.findUnique({ where: { id: otherUserId } }),
    ]);

    if (!currentUser || !otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 기존 1:1 채팅방이 있는지 확인
    const existingRoom = await prisma.chat_rooms.findFirst({
      where: {
        is_private: true,
        AND: [
          {
            chat_participants: {
              some: {
                user_id: currentUserId,
                is_left: { not: true },
              },
            },
          },
          {
            chat_participants: {
              some: {
                user_id: otherUserId,
                is_left: { not: true },
              },
            },
          },
        ],
        chat_participants: {
          every: {
            user_id: { in: [currentUserId, otherUserId] },
          },
        },
      },
      include: {
        chat_participants: {
          where: {
            is_left: { not: true },
          },
        },
      },
    });

    // 기존 채팅방이 있고, 정확히 2명의 참가자가 있는 경우 반환
    if (existingRoom && existingRoom.chat_participants.length === 2) {
      return NextResponse.json({
        chat_room_id: existingRoom.chat_room_id,
        name: otherUser.name,
        is_private: true,
      });
    }

    // 새 1:1 채팅방 생성
    const newRoom = await prisma.chat_rooms.create({
      data: {
        name: null, // 1:1 채팅방은 이름이 없음 (상대방 이름을 클라이언트에서 표시)
        is_private: true,
        creator_id: currentUserId,
        chat_participants: {
          create: [
            {
              user_id: currentUserId,
              is_left: false,
              last_read_at: new Date(),
            },
            {
              user_id: otherUserId,
              is_left: false,
              last_read_at: new Date(),
            },
          ],
        },
      },
    });

    return NextResponse.json({
      chat_room_id: newRoom.chat_room_id,
      name: otherUser.name,
      is_private: true,
    });
  } catch (error) {
    console.error("Error creating/finding direct chat room:", error);
    return HttpResponse.internalError("Failed to create/find direct chat room");
  }
}