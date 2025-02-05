import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ExerciseService } from './exercise.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RateDto } from 'src/common/dto/rate.dto';

@Controller()
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) { }

  @MessagePattern('create.exercise')
  createExercise(@Payload() createExerciseDto: CreateExerciseDto) {
    return this.exerciseService.createExercise(createExerciseDto);
  }

  @MessagePattern('find.all.exercise')
  findAllExercises(@Payload() paginationDto: PaginationDto) {
    return this.exerciseService.findAllExercises(paginationDto);
  }

  @MessagePattern('find.exercise.by.id')
  findExerciseById(@Payload('id', ParseIntPipe) id: number) {
    return this.exerciseService.findExerciseById(id);
  }

  @MessagePattern('rate.exercise')
  rateWorkout(@Payload() rateDto: RateDto ) {
    return this.exerciseService.rateExercise(rateDto);
  }

  @MessagePattern('update.one.exercise')
  updateExercise(@Payload() payload: { id: number, updateExerciseDto: UpdateExerciseDto }) {
    return this.exerciseService.updateExercise(payload.id, payload.updateExerciseDto);
  }

  @MessagePattern('remove.exercise')
  removeExercise(@Payload('id') id: number) {
    return this.exerciseService.removeExercise(id);
  }

  //@MessagePattern('calculate.stats.exercise')
  //calculateExerciseStatistics(@Payload('id') id:number) {
  //  return this.exerciseService.calculateExerciseStatistics(id);
  //}
}
