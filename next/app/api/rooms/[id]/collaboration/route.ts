
/**
 * @swagger
 * /api/rooms/{id}/collaboration:
 *   get:
 *     tags:
 *       - rooms
 *     summary: 방 협업 모드 상태 확인
 *     description: 특정 방의 현재 협업 모드 상태를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 방 ID
 *     responses:
 *       200:
 *         description: 방 협업 상태 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 collab_on:
 *                   type: boolean
 *                   description: 협업 모드 활성화 여부
 *       404:
 *         description: 방을 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */

import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: room_id } = await params;

    const room = await prisma.rooms.findUnique({
      where: { room_id },
      select: {
        collab_on: true,
      },
    });

    if (!room) {
      return new Response("방을 찾을 수 없습니다", { status: 404 });
    }

    return Response.json(room);
  } catch (error: any) {
    console.error("방 협업 상태 확인 오류:", error);
    
    return new Response("서버 내부 오류", { status: 500 });
  }
}

/**
 * @swagger
 * /api/rooms/{id}/collaboration:
 *   patch:
 *     tags:
 *       - rooms
 *     summary: 방 협업 모드 토글
 *     description: 특정 방의 협업 모드 상태를 업데이트합니다. 방 소유자만 이 설정을 변경할 수 있습니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 방 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - collab_on
 *             properties:
 *               collab_on:
 *                 type: boolean
 *                 description: 협업 모드를 켤지 끌지 여부
 *     responses:
 *       200:
 *         description: 방 협업 상태 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                   format: uuid
 *                 collab_on:
 *                   type: boolean
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 잘못된 요청 내용
 *       404:
 *         description: 방을 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: room_id } = await params;
    const body = await req.json();

    if (typeof body.collab_on !== "boolean") {
      return new Response("잘못된 요청: collab_on은 boolean 값이어야 합니다", {
        status: 400,
      });
    }

    const { collab_on } = body;

    const updatedRoom = await prisma.rooms.update({
      where: { room_id },
      data: {
        collab_on,
      },
      select: {
        room_id: true,
        collab_on: true,
        updated_at: true,
      },
    });

    return Response.json(updatedRoom);
  } catch (error: any) {
    console.error("방 협업 상태 업데이트 오류:", error);

    if (error.code === "P2025") {
      return new Response("방을 찾을 수 없습니다", { status: 404 });
    }

    return new Response("서버 내부 오류", { status: 500 });
  }
}
