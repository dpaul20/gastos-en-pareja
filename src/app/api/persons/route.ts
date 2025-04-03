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
    const persons = await prisma.person.findMany({
      where: {
        userId: session?.user.id,
      },
    });
    return NextResponse.json(persons);
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
    console.log({ body });
    const findPersons = await prisma.person.findMany({
      where: {
        userId: session?.user.id,
      },
    });
    console.log({ findPersons });
    if (findPersons.length > 0) {
      const updatedPersons = await prisma.user.update({
        where: {
          id: session?.user.id,
        },
        data: {
          Person: {
            updateMany: [
              {
                where: {
                  id: body[0].id,
                },
                data: {
                  income: body[0].income,
                },
              },
              {
                where: {
                  id: body[1].id,
                },
                data: {
                  income: body[1].income,
                },
              },
            ],
          },
        },
        include: {
          Person: true,
        },
      });
      return NextResponse.json(updatedPersons);
    }
    const persons = await prisma.person.createMany({
      data: [
        {
          name: body.person1,
          income: parseFloat(body.incomePerson1),
          userId: session?.user.id,
        },
        {
          name: body.person2,
          income: parseFloat(body.incomePerson2),
          userId: session?.user.id,
        },
      ],
    });
    return NextResponse.json(persons, { status: 201 });
  } catch (error) {
    console.error({ error });
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
