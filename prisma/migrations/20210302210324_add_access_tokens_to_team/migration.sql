/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[accessTokens]` on the table `Team`. If there are existing duplicate values, the migration will fail.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "accessTokens" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Team.accessTokens_unique" ON "Team"("accessTokens");
