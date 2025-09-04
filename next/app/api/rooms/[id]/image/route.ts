import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/rooms/{id}/image:
 *   put:
 *     summary: 방 썸네일 이미지 업데이트
 *     description: 특정 방의 썸네일 이미지 URL을 업데이트합니다.
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 방 ID
 *         example: "room_123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageKey
 *             properties:
 *               imageKey:
 *                 type: string
 *                 description: S3에 업로드된 이미지의 키값
 *                 example: "thumbnails/room-123-2024-01-01T12-00-00-000Z.png"
 *           example:
 *             imageKey: "thumbnails/room-123-2024-01-01T12-00-00-000Z.png"
 *     responses:
 *       200:
 *         description: 썸네일 이미지 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                   description: 방 ID
 *                 thumbnail_url:
 *                   type: string
 *                   description: 업데이트된 썸네일 이미지 키
 *                 title:
 *                   type: string
 *                   description: 방 제목
 *                 description:
 *                   type: string
 *                   description: 방 설명
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: 생성일시
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                   description: 수정일시
 *             example:
 *               room_id: "room_123"
 *               thumbnail_url: "thumbnails/room-123-2024-01-01T12-00-00-000Z.png"
 *               title: "거실 인테리어"
 *               description: "모던한 거실 공간"
 *               created_at: "2024-01-01T10:00:00.000Z"
 *               updated_at: "2024-01-01T12:00:00.000Z"
 *       500:
 *         description: 서버 오류
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "이미지 갱신에 실패했습니다"
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: room_id } = await params;
  const { imageKey } = await req.json();
  try {
    const room = await prisma.rooms.update({
      where: { room_id: room_id },
      data: { thumbnail_url: imageKey },
    });
    return new Response(JSON.stringify(room), { status: 200 });
  } catch (error) {
    console.error("방 썸네일 이미지 갱신 실패:", error);
    return new Response("이미지 갱신에 실패했습니다", { status: 500 });
  }
}