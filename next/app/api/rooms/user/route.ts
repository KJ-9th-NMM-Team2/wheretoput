/**
 * @swagger
 * /api/rooms/user:
 *   get:
 *     tags:
 *       - rooms
 *     summary: Check room ownership
 *     description: Verify if a specific room belongs to a specific user. Returns the room data if ownership is confirmed.
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the user.
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the room.
 *     responses:
 *       200:
 *         description: Room ownership confirmed. Returns room details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               nullable: true
 *               description: The room object, or null if no room is found.
 *       400:
 *         description: Missing required parameters.
 *       500:
 *         description: Internal Server Error.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const searchParmas = url.searchParams;
        const userId = searchParmas.get('userId');
        const roomId = searchParmas.get('roomId');
        
        const result = await prisma.rooms.findUnique({
            where: {
                user_id: userId || undefined,
                room_id: roomId || undefined,
            },
        })

        return Response.json(result);
    } catch (error) {
        console.error("Error Check Own User Room:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
} 