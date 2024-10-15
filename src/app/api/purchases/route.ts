import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { buyer: true },
    });
    return NextResponse.json(purchases);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching purchases" },
      { status: 500 }
    );
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
      { status: 500 }
    );
  }
}
