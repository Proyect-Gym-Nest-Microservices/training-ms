import { Module } from '@nestjs/common';
import { MuscleGroupService } from './muscle-group.service';
import { MuscleGroupController } from './muscle-group.controller';

@Module({
  controllers: [MuscleGroupController],
  providers: [MuscleGroupService],
})
export class MuscleGroupModule {}
