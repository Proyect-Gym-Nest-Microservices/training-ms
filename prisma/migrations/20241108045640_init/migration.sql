-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CARDIO', 'STRENGTH', 'FLEXIBILITY');

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "level" "Difficulty" NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "level" "Difficulty" NOT NULL,
    "category" "Category" NOT NULL,
    "trainingType" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseInWorkout" (
    "id" SERIAL NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "workoutId" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "restTime" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseInWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" SERIAL NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "Difficulty" NOT NULL,
    "category" "Category" NOT NULL,
    "equipment" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuscleGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuscleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkoutInPlan" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ExerciseMuscleGroups" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlan_name_key" ON "TrainingPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseInWorkout_workoutId_order_key" ON "ExerciseInWorkout"("workoutId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "_WorkoutInPlan_AB_unique" ON "_WorkoutInPlan"("A", "B");

-- CreateIndex
CREATE INDEX "_WorkoutInPlan_B_index" ON "_WorkoutInPlan"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ExerciseMuscleGroups_AB_unique" ON "_ExerciseMuscleGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_ExerciseMuscleGroups_B_index" ON "_ExerciseMuscleGroups"("B");

-- AddForeignKey
ALTER TABLE "ExerciseInWorkout" ADD CONSTRAINT "ExerciseInWorkout_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseInWorkout" ADD CONSTRAINT "ExerciseInWorkout_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkoutInPlan" ADD CONSTRAINT "_WorkoutInPlan_A_fkey" FOREIGN KEY ("A") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkoutInPlan" ADD CONSTRAINT "_WorkoutInPlan_B_fkey" FOREIGN KEY ("B") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseMuscleGroups" ADD CONSTRAINT "_ExerciseMuscleGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseMuscleGroups" ADD CONSTRAINT "_ExerciseMuscleGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "MuscleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
