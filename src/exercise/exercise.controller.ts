import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ExerciseService } from './exercise.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { PaginationDto } from 'src/common';

@Controller()
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  //@MessagePattern('create.exercise')
  @Post('/create')
  //create(@Payload() createExerciseDto: CreateExerciseDto) {
  create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exerciseService.create(createExerciseDto);
  }

  @Get('/find-all')
  //@MessagePattern('find.all.exercise')
    //findAll(@Payload() paginationDto:PaginationDto) {
  findAll(@Query() paginationDto:PaginationDto){
    return this.exerciseService.findAll(paginationDto);
  }

  @Get('/find/:id')
  //@MessagePattern('find.one.exercise')
  //findById(@Payload() id: number) {
  findById(@Param('id') id: number) {
    return this.exerciseService.findById(id);
  }

  @Patch('/update')
  update(@Body() updateExerciseDto: UpdateExerciseDto) {
    //@MessagePattern('update.exercise')
  //update(@Payload() updateExerciseDto: UpdateExerciseDto) {
    return this.exerciseService.update(updateExerciseDto);
  }

  @Delete('/delete/:id')
  remove(@Param('id') id: number) {
    //@MessagePattern('remove.exercise') //remove(@Payload() id: number) {
    return this.exerciseService.remove(id);
  }
}
