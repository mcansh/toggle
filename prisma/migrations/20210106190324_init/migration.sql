-- CreateEnum
CREATE TYPE "FlagType" AS ENUM ('String', 'Boolean', 'Int');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "teamId" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "type" "FlagType" NOT NULL,
    "value_number" INTEGER,
    "value_boolean" BOOLEAN,
    "value_string" TEXT,
    "teamId" TEXT,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User.username_unique" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Team.name_unique" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Flag.feature_unique" ON "Flag"("feature");

-- CreateIndex
CREATE UNIQUE INDEX "FlagPerTeam" ON "Flag"("feature");

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY("teamId")REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD FOREIGN KEY("teamId")REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
