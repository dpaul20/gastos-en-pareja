-- CreateTable
CREATE TABLE "IncomeCouple" (
    "id" TEXT NOT NULL,
    "person1" TEXT NOT NULL,
    "person2" TEXT NOT NULL,
    "incomePerson1" DOUBLE PRECISION NOT NULL,
    "incomePerson2" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeCouple_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IncomeCouple" ADD CONSTRAINT "IncomeCouple_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
