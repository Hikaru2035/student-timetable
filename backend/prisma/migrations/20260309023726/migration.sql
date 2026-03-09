/*
  Warnings:

  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Task";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeBlock" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalInfo" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "studentId" TEXT,
    "dateOfBirth" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "TimeBlock_userId_date_idx" ON "TimeBlock"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalInfo_userId_key" ON "PersonalInfo"("userId");

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalInfo" ADD CONSTRAINT "PersonalInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
