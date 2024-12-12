import { IsArray, IsInt } from 'class-validator';

export class FindWorkoutByIdsDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}