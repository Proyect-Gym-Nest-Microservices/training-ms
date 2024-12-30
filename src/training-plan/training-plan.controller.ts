import { Body, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TrainingPlanService } from './training-plan.service';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';
import { PaginationDto } from 'src/common';
import { FindTrainingPlanByIdsDto } from './dto/training-plan-by-ids.dto';
import { RateDto } from 'src/common/dto/rate.dto';

@Controller()
export class TrainingPlanController {
  constructor(private readonly trainingPlanService: TrainingPlanService) { }

  @MessagePattern('create.training.plan')
  createTrainingPlan(@Payload() createTrainingPlanDto: CreateTrainingPlanDto) {
    return this.trainingPlanService.createTrainingPlan(createTrainingPlanDto);
  }

  @MessagePattern('find.all.training.plan')
  findAllTrainingPlan(@Payload() paginationDto: PaginationDto) {
    return this.trainingPlanService.findAllTrainingPlan(paginationDto);
  }

  @MessagePattern('find.training.plan.by.id')
  findTrainingPlanById(@Payload('id', ParseIntPipe) id: number) {
    return this.trainingPlanService.findTrainingPlanById(id);
  }
  @MessagePattern('find.training.plan.by.ids')
  findTrainingPlanByIds(@Payload() payload: FindTrainingPlanByIdsDto) {
    console.log(payload)
    return this.trainingPlanService.findTrainingPlanByIds(payload.ids);
  }

  @MessagePattern('rate.training.plan')
  rateWorkout(@Payload() rateDto: RateDto ) {
    return this.trainingPlanService.rateTrainingPlan(rateDto);
  }


  @MessagePattern('update.Training.plan')
  updateTrainingPlan(@Payload() payload: { id: number, updateTrainingPlanDto: UpdateTrainingPlanDto }) {
    const { id, updateTrainingPlanDto } = payload;
    return this.trainingPlanService.updateTrainingPlan(id, updateTrainingPlanDto);
  }

  @MessagePattern('remove.training.plan')
  removeTrainingPlan(@Payload('id', ParseIntPipe) id: number) {
    return this.trainingPlanService.removeTrainingPlan(id);
  }
}
