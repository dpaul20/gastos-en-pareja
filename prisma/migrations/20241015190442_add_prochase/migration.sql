/*
  Warnings:

  - You are about to drop the column `incomePerson1` on the `IncomeCouple` table. All the data in the column will be lost.
  - You are about to drop the column `incomePerson2` on the `IncomeCouple` table. All the data in the column will be lost.
  - You are about to drop the column `person1` on the `IncomeCouple` table. All the data in the column will be lost.
  - You are about to drop the column `person2` on the `IncomeCouple` table. All the data in the column will be lost.
  - Added the required column `personId` to the `IncomeCouple` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IncomeCouple" DROP COLUMN "incomePerson1",
DROP COLUMN "incomePerson2",
DROP COLUMN "person1",
DROP COLUMN "person2",
ADD COLUMN     "personId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "income" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "firstPaymentDate" TIMESTAMP(3) NOT NULL,
    "installments" INTEGER NOT NULL,
    "paidInstallments" INTEGER NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IncomeCouple" ADD CONSTRAINT "IncomeCouple_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
