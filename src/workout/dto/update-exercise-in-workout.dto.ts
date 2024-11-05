import { PartialType } from "@nestjs/mapped-types";
import { CreateExerciseDto } from "src/exercise/dto/create-exercise.dto";
import { CreateExerciseInWorkoutDto } from "./create-exercise-in-workout.dto";

export class UpdateExerciseInWorkoutDto extends PartialType(CreateExerciseInWorkoutDto) {
    id: number;
}