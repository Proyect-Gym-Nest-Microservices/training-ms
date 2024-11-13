/*
  Warnings:

  - You are about to drop the column `equipment` on the `Exercise` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('MACHINE', 'FREE_WEIGHT', 'CARDIO', 'ACCESSORY', 'BODYWEIGHT');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'IN_MAINTENANCE', 'OUT_OF_ORDER');

-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "equipment";

-- CreateTable
CREATE TABLE "Equipment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "EquipmentCategory" NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EquipmentInExercise" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_name_key" ON "Equipment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_EquipmentInExercise_AB_unique" ON "_EquipmentInExercise"("A", "B");

-- CreateIndex
CREATE INDEX "_EquipmentInExercise_B_index" ON "_EquipmentInExercise"("B");

-- AddForeignKey
ALTER TABLE "_EquipmentInExercise" ADD CONSTRAINT "_EquipmentInExercise_A_fkey" FOREIGN KEY ("A") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentInExercise" ADD CONSTRAINT "_EquipmentInExercise_B_fkey" FOREIGN KEY ("B") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
