import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 시뮬레이터용 가구 3D 모델 로드 API
export async function GET(request, { params }) {
  try {
    const { id } = params;

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
      return NextResponse.json(
        { error: "가구를 찾을 수 없습니다." },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: "이미지 URL이 없어서 3D 모델을 생성할 수 없습니다." },
        { status: 400 }
      );
    }

    // Trellis API로 3D 모델 생성 요청
    const { generateTrellisModel } = await import("@/app/trellis_api.js");
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
    return NextResponse.json(
      { error: "3D 모델 로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
