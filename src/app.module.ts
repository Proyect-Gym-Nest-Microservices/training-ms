import { Module } from '@nestjs/common';

import { ExerciseModule } from './exercise/exercise.module';
import { WorkoutModule } from './workout/workout.module';
import { TrainingPlanModule } from './training-plan/training-plan.module';

@Module({
  imports: [ExerciseModule, WorkoutModule, TrainingPlanModule],
})
export class AppModule {}
