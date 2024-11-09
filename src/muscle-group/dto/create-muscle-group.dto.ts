import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMuscleGroupDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isDeleted?: boolean;
}
