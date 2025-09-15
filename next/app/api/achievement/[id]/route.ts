import { checkAchievement } from "@/lib/api/achievement/checkAchievement";
import { HttpResponse } from "@/utils/httpResponse";
import { NextRequest } from "next/server";


/**
 * @swagger
 * /api/achievement/{id}:
 *   get:
 *     tags:
 *       - Achievement
 *     summary: 특정 유저의 업적 조회
 *     description: 사용자 ID를 이용해 해당 사용자의 업적을 조회합니다.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 업적을 조회할 사용자 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 업적 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123"
 *                 achievements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "First Chat"
 *                       unlocked:
 *                         type: boolean
 *                         example: true
 *       404:
 *         description: 업적을 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
export async function GET(req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await checkAchievement(id);
        if (!result) {
            return HttpResponse.notFound("Can not find achivements at all");
        }
        
        return Response.json(result);
    } catch (error) {
        console.error("Error check user achievement:", error);
        return HttpResponse.internalError();
    }
}