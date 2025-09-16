import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { HttpResponse } from "@/utils/httpResponse";

/**
 * @swagger
 * /api/furniture/{id}/model:
 *   get:
 *     tags:
 *       - 3D Model
 *     summary: 시뮬레이터용 가구 3D 모델을 조회하거나 생성합니다.
 *     description: |
 *       `id`에 해당하는 가구의 3D 모델을 조회합니다. 데이터베이스에 모델 URL이 있으면 즉시 반환하고, 없으면 이미지 URL을 기반으로 Trellis API를 통해 새로운 모델을 생성하여 반환합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 가구의 고유 ID
 *     responses:
 *       '200':
 *         description: 3D 모델 조회 또는 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 model_url:
 *                   type: string
 *                   description: 3D 모델의 URL
 *                   example: "https://example.com/models/chair.glb"
 *                 source:
 *                   type: string
 *                   enum: [existing, generated]
 *                   description: 모델의 출처 ('existing'은 DB에 이미 존재, 'generated'는 새로 생성)
 *                   example: "generated"
 *                 message:
 *                   type: string
 *                   description: 모델이 새로 생성된 경우에만 반환
 *                   example: "3D 모델이 생성되었습니다."
 *       '400':
 *         description: 유효하지 않은 요청 (이미지 URL 누락)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "이미지 URL이 없어서 3D 모델을 생성할 수 없습니다."
 *       '404':
 *         description: 가구를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "가구를 찾을 수 없습니다."
 *       '500':
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "3D 모델 로드 중 오류가 발생했습니다."
 */

const prisma = new PrismaClient();

// 시뮬레이터용 가구 3D 모델 로드 API
export async function GET(request: NextRequest, { params } : { params : Promise<{ id: string }>}) {
  try {
    const { id } = await params;

    // furniture 정보 조회
    const furniture = await prisma.furnitures.findUnique({
      where: { furniture_id: id },
      select: {
        furniture_id: true,
        name: true,
        image_url: true,
        model_url: true,
      },
    });

    if (!furniture) {
      return HttpResponse.notFound("가구를 찾을 수 없습니다.");
    }

    // model_url이 존재하면 바로 반환
    if (furniture.model_url) {
      return NextResponse.json({
        success: true,
        model_url: furniture.model_url,
        source: "existing",
      });
    }

    // model_url이 없으면 Trellis로 생성 필요
    if (!furniture.image_url) {
      return HttpResponse.badRequest("이미지 URL이 없어서 3D 모델을 생성할 수 없습니다.");
    }

    // Trellis API로 3D 모델 생성 요청
    const { generateTrellisModel } = await import("@/lib/trellis_api.js");
    const result = await generateTrellisModel(
      furniture.furniture_id,
      furniture.image_url
    );

    return NextResponse.json({
      success: true,
      model_url: result.model_url,
      source: "generated",
      message: "3D 모델이 생성되었습니다.",
    });
  } catch (error) {
    console.error("3D 모델 로드 오류:", error);
    return HttpResponse.internalError("3D 모델 로드 중 오류가 발생했습니다.");
  }
}
