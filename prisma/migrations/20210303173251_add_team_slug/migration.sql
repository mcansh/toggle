/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[slug]` on the table `Team`. If there are existing duplicate values, the migration will fail.
  - Added the required column `slug` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Team.slug_unique" ON "Team"("slug");
