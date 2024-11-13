import { EquipmentStatus, EquipmentStatusList } from "../enums/status.enum";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
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
