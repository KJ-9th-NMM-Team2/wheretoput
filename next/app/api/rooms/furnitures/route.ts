/**
 * @swagger
 * /api/rooms/furnitures:
 *   put:
 *     tags:
 *       - rooms
 *     summary: Update room furniture
 *     description: Update furniture configuration for a specific room.
 *     parameters:
 *       - in: query
 *         name: furnitures
 *         required: true
 *         schema:
 *           type: string
 *         description: The furniture configuration data.
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the room.
 *     responses:
 *       200:
 *         description: Room furniture updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               nullable: true
 *               description: The updated room object, or null if no room is found.
 *       400:
 *         description: Missing required parameters.
 *       500:
 *         description: Internal Server Error.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";


export async function PUT(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const searchParmas = url.searchParams;
        const furnitures = searchParmas.get('furnitures');
        const roomId = searchParmas.get('roomId');

        // const result = prisma.rooms.find({
        //     where: {
        //         user_id: userId || undefined,
        //         room_id: roomId || undefined,
        //     },
        // })

        // return Response.json(result);
    } catch (error) {
        console.error("Error Check Own User Room:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
} 