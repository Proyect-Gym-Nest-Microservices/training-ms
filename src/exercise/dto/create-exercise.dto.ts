import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
        message: `Possible status value are ${DifficultiesList}`
    })
    @IsNotEmpty()
    level: Difficulty;

    @IsEnum(CategoriesList, {
        message: `Possible status value are ${CategoriesList}`
    })
    @IsNotEmpty()
    category: Category;

    @IsString()
    @IsNotEmpty()
    equipment: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsArray()
    muscleGroupsIds: number[];

    @IsOptional()
    @IsString()
    recommendation?: string;

    @IsBoolean()
    @IsOptional()
    isDeleted?: boolean
}