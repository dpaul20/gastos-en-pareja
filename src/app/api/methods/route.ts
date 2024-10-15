import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const method = await prisma.method.findFirst({
      where: {
        userId: session?.user.id,
      },
      include: {
        methodType: true,
      },
    });

    return NextResponse.json(method);
  } catch (error) {
    console.error({ error });
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
    const methodType = await prisma.methodType.findFirst({
      where: {
        name: body.methodName,
      },
    });
    if (!methodType) {
      return NextResponse.json(
        { error: "MethodType not found" },
        { status: 404 },
      );
    }
    const method = await prisma.method.create({
      data: {
        methodType: {
          connect: {
            id: methodType.id,
          },
        },
        user: {
          connect: {
            id: session?.user.id,
          },
        },
      },
    });
    return NextResponse.json(method, { status: 201 });
  } catch (error) {
    console.error({ error });
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    if (!body.methodName) {
      return NextResponse.json(
        { error: "Method name is required" },
        { status: 400 },
      );
    }
    const methodType = await prisma.methodType.findFirst({
      where: {
        name: body.methodName,
      },
    });

    if (!methodType) {
      return NextResponse.json(
        { error: "MethodType not found" },
        { status: 404 },
      );
    }
    const method = await prisma.method.findFirst({
      where: {
        userId: session.user.id,
      },
    });
    if (!method) {
      return NextResponse.json({ error: "Method not found" }, { status: 404 });
    }
    const updatedMethod = await prisma.method.update({
      where: {
        id: method.id,
      },
      data: {
        methodType: {
          connect: {
            id: methodType.id,
          },
        },
      },
    });
    return NextResponse.json(updatedMethod);
  } catch (error) {
    console.error({ error });
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
