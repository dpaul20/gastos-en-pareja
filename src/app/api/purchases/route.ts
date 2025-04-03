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

    const purchases = await prisma.purchase.findMany({
      where: {
        Person: {
          userId: session?.user.id,
        },
      },
    });
    return NextResponse.json(purchases);
  } catch (error) {
    console.error({ error });
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const purchase = await prisma.purchase.create({
      data: {
        description: body.description,
        amount: body.amount,
        installments: body.installments,
        paidInstallments: body.paidInstallments,
        firstPaymentDate: new Date(body.firstPaymentDate),
        buyerId: body.buyerId,
      },
    });
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating purchase" },
      { status: 500 },
    );
  }
}
