import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Difficulty, Category } from '@prisma/client';
import { DifficultiesList } from '../enums/difficulties.enu';
import { CategoriesList } from '../enums/categories.enum';

export class CreateExerciseDto {
    @IsString()
    @IsNotEmpty()
    mediaUrl?: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(DifficultiesList, {
        message: `Possible level value are ${DifficultiesList}`
    })
    @IsNotEmpty()
    level: Difficulty;

    @IsEnum(CategoriesList, {
        message: `Possible category value are ${CategoriesList}`
    })
    @IsNotEmpty()
    category: Category;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true, message: 'Each muscle group ID must be an integer.' })
    muscleGroupsIds: number[];

    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true, message: 'Each equipment ID must be an integer.' })
    equipmentIds: number[];

    @IsOptional()
    @IsString()
    recommendation?: string;

    @IsBoolean()
    @IsOptional()
    isDeleted?: boolean
}