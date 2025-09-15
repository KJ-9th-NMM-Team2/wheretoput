/**
 * @swagger
 * /api/chat/token:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: 세션 토큰의 유효성을 검증하고 새로운 JWT를 발급합니다.
 *     description: |
 *       요청에 포함된 세션 쿠키를 기반으로 사용자의 토큰 유효성을 확인하고, 유효한 경우 새로운 JWT를 생성하여 반환합니다. 이 JWT는 특정 시간(1시간) 동안 유효하며, 사용자 ID를 포함합니다.
 *     responses:
 *       '200':
 *         description: 토큰 검증 성공 및 새 JWT 발급
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: 유효성 검증 후 발급된 새로운 JWT
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbGl2Z2Q1MjhjMDAxcnEwZDV5czI3ZXIxIiwiaWF0IjoxNjk4NDMwODAwLCJleHAiOjE2OTg0MzQ0MDB9.s1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0"
 *                 userId:
 *                   type: string
 *                   description: 토큰에 포함된 사용자 ID
 *                   example: "clivgnd528c001rq0d5ys27er1"
 *       '401':
 *         description: 토큰이 유효하지 않거나 존재하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No token"
 *       '500':
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "토큰 발급 중 오류가 발생했습니다."
 */

import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import { HttpResponse } from "@/utils/httpResponse";

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
    return HttpResponse.unAuthorized("No token");
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
