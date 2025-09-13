import { NextRequest, NextResponse } from "next/server";
import { createAchievementsData, getUserAchievementsWithStatus } from "@/lib/api/achievement/achievements";

/**
 * @swagger
 * /api/users/{id}/achievements:
 *   post:
 *     tags:
 *       - Achievements
 *     summary: 업적 생성
 *     description: 새 업적 데이터를 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: 업적 데이터 배열 또는 단일 업적 객체 (createAchievementsData에 맞는 구조)
 *             example:
 *               - id: "achv_001"
 *                 name: "첫 가구 배치"
 *                 description: "방에 처음으로 가구를 배치하면 달성"
 *               - id: "achv_002"
 *                 name: "꾸미기 마스터"
 *                 description: "방에 10개 이상의 가구를 배치하면 달성"
 *     responses:
 *       201:
 *         description: 업적 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "sccuesfully created"
 *                 status:
 *                   type: integer
 *                   example: 201
 *       500:
 *         description: 업적 생성 실패
 * 
 * /api/users/[id]/achievements:
 *   get:
 *     tags:
 *       - Achievements
 *     summary: 특정 유저의 업적 조회
 *     description: 사용자 ID를 이용해 해당 사용자의 업적 목록과 달성 상태를 조회합니다.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 업적을 조회할 사용자 ID
 *         schema:
 *           type: string
 *           example: "user_123"
 *     responses:
 *       200:
 *         description: 업적 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "achv_001"
 *                   name:
 *                     type: string
 *                     example: "첫 가구 배치"
 *                   description:
 *                     type: string
 *                     example: "방에 처음으로 가구를 배치하면 달성"
 *                   unlocked:
 *                     type: boolean
 *                     example: true
 *       500:
 *         description: 업적 조회 실패
 */

export async function POST(request: NextRequest) {
  try {
    const datas = await request.json();
    if (await createAchievementsData(datas)) {
      return NextResponse.json({message: "sccuesfully created", status:201});
    }

    return NextResponse.json("Create fail", {status: 500});
    
  } catch (error) {
    console.error("Error creating achievements:", error);
    return NextResponse.json(
      { error: "Failed to create achievements", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const achievements = await getUserAchievementsWithStatus(id);
    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}

