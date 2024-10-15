import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const income = await prisma.incomeCouple.findFirst({
      where: {
        userId: session?.user.id,
      },
    });
    return NextResponse.json(income);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const income = await prisma.incomeCouple.upsert({
      where: {
        userId: session?.user.id,
      },
      update: body,
      create: {
        ...body,
        userId: session?.user.id,
      },
    });
    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
