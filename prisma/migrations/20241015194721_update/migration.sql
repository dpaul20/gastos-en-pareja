/*
  Warnings:

  - You are about to drop the `IncomeCouple` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_IncomeCoupleToPerson` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "IncomeCouple" DROP CONSTRAINT "IncomeCouple_userId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_personId_fkey";

-- DropForeignKey
ALTER TABLE "_IncomeCoupleToPerson" DROP CONSTRAINT "_IncomeCoupleToPerson_A_fkey";

-- DropForeignKey
ALTER TABLE "_IncomeCoupleToPerson" DROP CONSTRAINT "_IncomeCoupleToPerson_B_fkey";

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Purchase" ALTER COLUMN "personId" DROP NOT NULL;

-- DropTable
DROP TABLE "IncomeCouple";

-- DropTable
DROP TABLE "_IncomeCoupleToPerson";

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
