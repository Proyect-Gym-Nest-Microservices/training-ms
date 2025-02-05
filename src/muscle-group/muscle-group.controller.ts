import { Controller, ParseIntPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MuscleGroupService } from './muscle-group.service';
import { CreateMuscleGroupDto } from './dto/create-muscle-group.dto';
import { UpdateMuscleGroupDto } from './dto/update-muscle-group.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller()
export class MuscleGroupController {
  constructor(private readonly muscleGroupService: MuscleGroupService) {}

  @MessagePattern('create.muscle.group')
  createMuscleGroup(@Payload() createMuscleGroupDto: CreateMuscleGroupDto) {
    return this.muscleGroupService.createMuscleGroup(createMuscleGroupDto);
  }

  @MessagePattern('find.all.muscle.group')
  findAllMuscleGroup(@Payload() paginationDto: PaginationDto) {
    return this.muscleGroupService.findAllMuscleGroup(paginationDto);
  }

  @MessagePattern('find.one.muscle.group')
  findMuscleGroupById(@Payload('id',ParseIntPipe) id: number) {
    return this.muscleGroupService.findMuscleGroupById(id);
  }

  @MessagePattern('update.muscle.group')
  updateMuscleGroup(@Payload() payload: { id: number, updateMuscleGroupDto: UpdateMuscleGroupDto }) {
    return this.muscleGroupService.updateMuscleGroup(payload.id, payload.updateMuscleGroupDto);
  }

  @MessagePattern('remove.muscle.group')
  removeMuscleGroup(@Payload('id',ParseIntPipe) id: number) {
    return this.muscleGroupService.removeMuscleGroup(id);
  }
}
