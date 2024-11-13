/*
  Warnings:

  - Added the required column `mediaUrl` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaUrl` to the `MuscleGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "mediaUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MuscleGroup" ADD COLUMN     "mediaUrl" TEXT NOT NULL;
