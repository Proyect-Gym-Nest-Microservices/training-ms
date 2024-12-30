import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WorkoutService } from './workout.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { PaginationDto } from 'src/common';
import { FindWorkoutByIdsDto } from './dto/workout-by-ids.dto';
import { RateDto } from 'src/common/dto/rate.dto';

@Controller()
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @MessagePattern('create.workout')
  createWorkout(@Payload() createWorkoutDto: CreateWorkoutDto) {
    return this.workoutService.createWorkout(createWorkoutDto); 
  }

  @MessagePattern('find.all.Workouts')
  findAllWorkouts(@Payload() paginationDto: PaginationDto) {
    return this.workoutService.findAllWorkouts(paginationDto);
  }

  @MessagePattern('find.one.workout')
  findWorkoutById(@Payload('id',ParseIntPipe) id: number) {
    return this.workoutService.findWorkoutById(id);
  }
  @MessagePattern('find.workout.by.ids')
  findWorkoutByIds(@Payload() payload: FindWorkoutByIdsDto ) {
    return this.workoutService.findWorkoutByIds(payload.ids);
  }

  @MessagePattern('find.one.exercise.in.workout')
  findExerciseInWorkoutById(@Payload('id',ParseIntPipe) id: number) {
    return this.workoutService.findExerciseInWorkoutById(id);
  }


  @MessagePattern('update.workout')
  updateWorkout(@Payload() payload: { id: number, updateWorkoutDto: UpdateWorkoutDto }) {
    const {id,updateWorkoutDto}=payload
    return this.workoutService.updateWorkout(id, updateWorkoutDto);
  }
  @MessagePattern('rate.workout')
  rateWorkout(@Payload() rateDto: RateDto) {

    return this.workoutService.rateWorkout(rateDto);
  }

  @MessagePattern('remove.workout')
  remove(@Payload('id',ParseIntPipe) id: number) {
    return this.workoutService.removeWorkout(id);
  }
}
