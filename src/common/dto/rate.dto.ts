import { Transform, Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsPositive, Max, Min } from "class-validator";


export class RateDto {

    @Transform(({ value }) => Number(value), { toClassOnly: true })
    @IsNumber({}, { message: 'Target ID must be a valid number' })
    targetId: number;

    @IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'Score must be a valid number' })
    @Min(0, { message: 'Score must be at least 0' })
    @Max(5, { message: 'Score cannot be greater than 5' })
    score: number;

    @IsNumber({ allowNaN: false }, { message: 'Total ratings must be a valid number' })
    @Min(0, { message: 'Total ratings cannot be negative' })
    totalRatings: number;
}