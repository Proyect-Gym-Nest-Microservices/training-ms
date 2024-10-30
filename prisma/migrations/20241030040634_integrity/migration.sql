-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MuscleGroup" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TrainingPlan" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
