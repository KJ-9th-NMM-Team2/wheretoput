import { prisma } from "@/lib/prisma";

// GET 요청을 받았을 때
export async function GET() {
  const furnitures = await prisma.furnitures.findMany();
  return Response.json(furnitures);
}
