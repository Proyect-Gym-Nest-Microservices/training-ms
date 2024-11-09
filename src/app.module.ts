import { Module } from '@nestjs/common';

import { ExerciseModule } from './exercise/exercise.module';
import { WorkoutModule } from './workout/workout.module';
import { TrainingPlanModule } from './training-plan/training-plan.module';
import { MuscleGroupModule } from './muscle-group/muscle-group.module';

@Module({
  imports: [ExerciseModule, WorkoutModule, TrainingPlanModule, MuscleGroupModule],
})
export class AppModule {}
