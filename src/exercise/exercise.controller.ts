import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ExerciseService } from './exercise.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { PaginationDto } from 'src/common';

@Controller()
//@Controller('api/training')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @MessagePattern('create.exercise')
  createExercise(@Payload() createExerciseDto: CreateExerciseDto) {
  //@Post('create-exercise')
  //createExercise(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exerciseService.createExercise(createExerciseDto);
  }

  @MessagePattern('find.all.exercise')
  findAllExercises(@Payload() paginationDto:PaginationDto) {
  //@Get('find-all-exercises')
  //findAllExercises(@Query() paginationDto:PaginationDto) {
    return this.exerciseService.findAllExercises(paginationDto);
  }

  @MessagePattern('find.exercise.by.id')
  findExerciseById(@Payload('id',ParseIntPipe) id: number) {
  //@Get('find-by-id/:id')
  //findExerciseById(@Param('id',ParseIntPipe) id: number) {
    return this.exerciseService.findExerciseById(id);
  }


  @MessagePattern('update.one.exercise')
  updateExercise(@Payload() payload: { id: number, updateExerciseDto: UpdateExerciseDto }) {
  //@Patch('update/:id')
  //updateExercise(@Body() updateExerciseDto: UpdateExerciseDto, @Param('id',ParseIntPipe) id: number) {
    //return this.exerciseService.updateExercise(id,updateExerciseDto );
    return this.exerciseService.updateExercise(payload.id,payload.updateExerciseDto );
  }

  @MessagePattern('remove.exercise') 
  removeExercise(@Payload('id') id: number) {
  //@Delete('delete/:id')
  //removeExercise(@Param('id',ParseIntPipe) id: number) {
    return this.exerciseService.removeExercise(id);
  }
}
