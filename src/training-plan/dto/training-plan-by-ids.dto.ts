import { IsArray, IsInt } from 'class-validator';

export class FindTrainingPlanByIdsDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}