import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chatRooms = await prisma.chat_rooms.findMany({
      where: {
        OR: [
          { creator_id: user.id },
          {
            chat_participants: {
              some: {
                user_id: user.id,
              },
            },
          },
        ],
      },
      include: {
        chat_messages: {
          orderBy: {
            created_at: "desc",
          },
          take: 1,
        },
        chat_participants: {
          include: {
            user: true,
          },
        },
        creator: true,
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    console.log("반환:", chatRooms);
    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}
