import { IsString } from "class-validator"


export class MuscleDto{

    @IsString()
    name: string

    @IsString()
    description: string
    
}