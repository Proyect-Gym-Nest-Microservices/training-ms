import { EquipmentStatus, EquipmentStatusList } from "../enums/status.enum";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { EquipmentCategory, EquipmentCategoryList } from "../enums/categories.enum";

export class CreateEquipmentDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    mediaUrl?: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @Min(0, { message: 'Score must be at least 0' }) 
    @Max(5, { message: 'Score cannot be greater than 5' })
    @IsOptional()
    score?: number;

    @IsEnum(EquipmentCategoryList, {
        message: `Possible category value are ${EquipmentCategoryList}`
    })
    @IsNotEmpty()
    category: EquipmentCategory;

    @IsEnum(EquipmentStatusList, {
        message: `Possible status value are ${EquipmentStatusList}`
    })
    @IsNotEmpty()
    status: EquipmentStatus

    @IsBoolean()
    @IsOptional()
    isDeleted?: boolean;
    
}
