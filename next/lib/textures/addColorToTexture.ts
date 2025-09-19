import sharp from "sharp";

/**
 * 이미지 버퍼와 색상을 합성하는 함수
 * @param imageBuffer - 업로드된 이미지 버퍼
 * @param color - 섞을 색상 (#rrggbb)
 * @param alpha - 색상 투명도 (0~1, 기본 0.5)
 * @returns Promise<Buffer> - 합성된 이미지 버퍼 (PNG)
 */
export async function mixImageWithColorServer(
  imageBuffer: Buffer,
  color: string,
  alpha: number = 0.5
): Promise<Buffer> {
  // sharp로 이미지 불러오기
  const image = sharp(imageBuffer);
  const { width, height } = await image.metadata();

  if (!width || !height) throw new Error("Invalid image dimensions");

  // RGBA 값으로 변환
  const { r, g, b } = hexToRgb(color);

  // 색상 레이어 생성
  const colorLayer = {
    create: {
      width,
      height,
      channels: 4,
      background: { r, g, b, alpha },
    },
  };

  // 이미지 합성
  const outputBuffer = await sharp(colorLayer)
    .composite([{ input: await image.png().toBuffer(), blend: "over" }])
    .png()
    .toBuffer();

  return outputBuffer;
}

/** 헥스 색상 (#rrggbb) → r,g,b 객체 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = hex.replace("#", "").match(/.{2}/g);
  if (!match) throw new Error("Invalid hex color");
  return {
    r: parseInt(match[0], 16),
    g: parseInt(match[1], 16),
    b: parseInt(match[2], 16),
  };
}
