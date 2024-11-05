import { Category, Difficulty } from "src/common";

export class CreateWorkoutDto {

    name: string;

    description: string;

    frequency: number;

    duration: number;

    level: Difficulty;

    category: Category;

    trainingType: string;

    exercises: number[];

    

}
