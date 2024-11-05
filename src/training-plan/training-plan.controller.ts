import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TrainingPlanService } from './training-plan.service';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';

@Controller()
export class TrainingPlanController {
  constructor(private readonly trainingPlanService: TrainingPlanService) {}

  @MessagePattern('createTrainingPlan')
  create(@Payload() createTrainingPlanDto: CreateTrainingPlanDto) {
    return this.trainingPlanService.create(createTrainingPlanDto);
  }

  @MessagePattern('findAllTrainingPlan')
  findAll() {
    return this.trainingPlanService.findAll();
  }

  @MessagePattern('findOneTrainingPlan')
  findOne(@Payload() id: number) {
    return this.trainingPlanService.findOne(id);
  }

  @MessagePattern('updateTrainingPlan')
  update(@Payload() updateTrainingPlanDto: UpdateTrainingPlanDto) {
    return this.trainingPlanService.update(updateTrainingPlanDto.id, updateTrainingPlanDto);
  }

  @MessagePattern('removeTrainingPlan')
  remove(@Payload() id: number) {
    return this.trainingPlanService.remove(id);
  }
}
