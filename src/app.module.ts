import { Module } from '@nestjs/common';

import { ExerciseModule } from './exercise/exercise.module';

@Module({
  imports: [ExerciseModule],
})
export class AppModule {}
