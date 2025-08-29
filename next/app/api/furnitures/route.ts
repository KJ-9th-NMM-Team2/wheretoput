import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/furnitures:
 *   get:
 *     tags:
 *       - furnitures
 *     summary: Get all furnitures
 *     description: Retrieve a list of all furnitures
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
export async function GET() {
  const furnitures = await prisma.furnitures.findMany();
  return Response.json(furnitures);
}
