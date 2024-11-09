import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TrainingPlanService } from './training-plan.service';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';
import { PaginationDto } from 'src/common';

//@Controller('api/training-plan')
@Controller()
export class TrainingPlanController {
  constructor(private readonly trainingPlanService: TrainingPlanService) { }

  @MessagePattern('create.training.plan')
  createTrainingPlan(@Payload() createTrainingPlanDto: CreateTrainingPlanDto) {
  //@Post('create')
  //createTrainingPlan(@Body() createTrainingPlanDto: CreateTrainingPlanDto) {
    return this.trainingPlanService.createTrainingPlan(createTrainingPlanDto);
  }

  @MessagePattern('find.all.training.plan')
  findAllTrainingPlan(@Payload() paginationDto: PaginationDto){
  //@Get('find-all')
  //findAllTrainingPlan(@Query() paginationDto: PaginationDto) {
    return this.trainingPlanService.findAllTrainingPlan(paginationDto);
  }

  @MessagePattern('find.training.plan.by.id')
  findTrainingPlanById(@Payload('id',ParseIntPipe) id: number) {
  //@Get('find-by-id/:id')
  //findTrainingPlanById(@Param('id', ParseIntPipe) id: number) {
    return this.trainingPlanService.findTrainingPlanById(id);
  }

  @MessagePattern('update.Training.plan')
  updateTrainingPlan(@Payload() payload: {id:number, updateTrainingPlanDto: UpdateTrainingPlanDto }) {
  //@Patch('update/:id')
  //updateTrainingPlan(@Param('id', ParseIntPipe) id: number, @Body() updateTrainingPlanDto: UpdateTrainingPlanDto) {
    const { id, updateTrainingPlanDto} = payload;
    return this.trainingPlanService.updateTrainingPlan(id, updateTrainingPlanDto);
  }

  @MessagePattern('remove.training.plan')
  removeTrainingPlan(@Payload('id',ParseIntPipe) id: number) {
  //@Delete('delete/:id')
  //removeTrainingPlan(@Param('id',ParseIntPipe) id: number) {
    return this.trainingPlanService.removeTrainingPlan(id);
  }
}
