/*
  Warnings:

  - The primary key for the `MethodType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `MethodType` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `methodTypeId` on the `Method` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Method" DROP CONSTRAINT "Method_methodTypeId_fkey";

-- AlterTable
ALTER TABLE "Method" DROP COLUMN "methodTypeId",
ADD COLUMN     "methodTypeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "MethodType" DROP CONSTRAINT "MethodType_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "MethodType_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Method" ADD CONSTRAINT "Method_methodTypeId_fkey" FOREIGN KEY ("methodTypeId") REFERENCES "MethodType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
