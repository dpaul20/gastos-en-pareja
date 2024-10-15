import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const method = await prisma.methodType.findMany();

    return NextResponse.json(method);
  } catch (error) {
    console.error({ error });
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
