/*
  Warnings:

  - You are about to drop the column `value_number` on the `Flag` table. All the data in the column will be lost.
  - You are about to drop the column `value_boolean` on the `Flag` table. All the data in the column will be lost.
  - You are about to drop the column `value_string` on the `Flag` table. All the data in the column will be lost.
  - Added the required column `value` to the `Flag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Flag" DROP COLUMN "value_number",
DROP COLUMN "value_boolean",
DROP COLUMN "value_string",
ADD COLUMN     "value" TEXT NOT NULL;

-- AlterIndex
ALTER INDEX "FlagPerTeam" RENAME TO "Flag.feature_unique";
