import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WorkoutService } from './workout.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';

@Controller()
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @MessagePattern('create.workout')
  create(@Payload() createWorkoutDto: CreateWorkoutDto) {
    return this.workoutService.create(createWorkoutDto);
  }

  @MessagePattern('find.all.Workouts')
  findAll() {
    return this.workoutService.findAll();
  }

  @MessagePattern('find.one.workout')
  findOne(@Payload() id: number) {
    return this.workoutService.findOne(id);
  }

  @MessagePattern('update.workout')
  update(@Payload() updateWorkoutDto: UpdateWorkoutDto) {
    return this.workoutService.update(updateWorkoutDto.id, updateWorkoutDto);
  }

  @MessagePattern('remove.workout')
  remove(@Payload() id: number) {
    return this.workoutService.remove(id);
  }
}
