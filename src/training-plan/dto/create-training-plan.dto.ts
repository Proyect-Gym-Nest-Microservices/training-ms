import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { DifficultiesList, Difficulty } from "src/common";

export class CreateTrainingPlanDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(DifficultiesList, {
        message: `Possible status value are ${DifficultiesList}`
    })
    @IsNotEmpty()
    level: Difficulty;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDate({ message: 'The start date must be a valid date.' })
    @Type(() => Date)
    startDate: Date;

    @IsOptional()
    @IsDate({ message: 'The end date must be a valid date.' })
    @Type(() => Date)
    endDate?: Date;

    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true, message: 'Each workout ID must be an integer.' })
    workoutsIds: number[];

    @IsOptional()
    @IsBoolean()
    isDeleted?: boolean;
}
