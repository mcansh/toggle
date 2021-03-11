/*
  Warnings:

  - You are about to drop the column `teamId` on the `Flag` table. All the data in the column will be lost.
  - Added the required column `createdByUserId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Flag" DROP CONSTRAINT "Flag_teamId_fkey";

-- AlterTable
ALTER TABLE "Flag" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "createdByUserId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Team" ADD FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
