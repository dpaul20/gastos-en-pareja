/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `IncomeCouple` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "IncomeCouple_userId_key" ON "IncomeCouple"("userId");
