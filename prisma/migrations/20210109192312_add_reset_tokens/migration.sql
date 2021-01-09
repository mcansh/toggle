/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[resetToken]` on the table `User`. If there are existing duplicate values, the migration will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User.resetToken_unique" ON "User"("resetToken");
