import swaggerSpec from "@/lib/swagger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(swaggerSpec);
}
