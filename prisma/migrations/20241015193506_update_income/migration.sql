/*
  Warnings:

  - You are about to drop the column `personId` on the `IncomeCouple` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "IncomeCouple" DROP CONSTRAINT "IncomeCouple_personId_fkey";

-- AlterTable
ALTER TABLE "IncomeCouple" DROP COLUMN "personId";

-- CreateTable
CREATE TABLE "_IncomeCoupleToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_IncomeCoupleToPerson_AB_unique" ON "_IncomeCoupleToPerson"("A", "B");

-- CreateIndex
CREATE INDEX "_IncomeCoupleToPerson_B_index" ON "_IncomeCoupleToPerson"("B");

-- AddForeignKey
ALTER TABLE "_IncomeCoupleToPerson" ADD CONSTRAINT "_IncomeCoupleToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "IncomeCouple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncomeCoupleToPerson" ADD CONSTRAINT "_IncomeCoupleToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
