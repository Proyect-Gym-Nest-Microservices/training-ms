import { IsInt, IsNumber, IsOptional } from "class-validator";

export class CreateExerciseInWorkoutDto{

    @IsInt()
    exerciseId: number;

    @IsInt()
    sets: number;

    @IsInt()
    reps: number;

    @IsOptional()
    @IsNumber()
    weight?: number;

    @IsInt()
    restTime: number;

    @IsInt()
    order: number;

}