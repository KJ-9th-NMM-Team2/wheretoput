// 수정 필요
/**
 * @swagger
 * /api/chat/token:
 *   get:
 *     tags:
 *       - chat token
 *     summary: 토큰 교환 + 소켓 준비
 *     description: 토큰 교환 + 소켓 준비
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

import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

// 토큰이 유효한지 체크하는 API
export async function GET(req: Request) {
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  const token = await getToken({
    req: req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: cookieName,
  });

  if (!token) {
    return Response.json({ error: "No token" }, { status: 401 });
  }

  const jwtToken = jwt.sign(
    { userId: token.id },
    process.env.NEXTAUTH_SECRET || "",
    { expiresIn: "1h" }
  );

  return Response.json({
    token: jwtToken,
    userId: token.id,
  });
}
