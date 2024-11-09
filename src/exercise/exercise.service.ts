import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common';

@Injectable()
export class ExerciseService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Exercise-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('DataBase connected');
  }

  async createExercise(createExerciseDto: CreateExerciseDto) {
    try {

      await this.validateExerciseName(createExerciseDto.name)
      await this.validateMuscleGroups(createExerciseDto.muscleGroupsIds)

      const newExercise = await this.exercise.create({
        data: {
          name: createExerciseDto.name,
          mediaUrl: createExerciseDto.mediaUrl,
          level: createExerciseDto.level,
          category: createExerciseDto.category,
          equipment: createExerciseDto.equipment,
          description: createExerciseDto.description,
          recommendation: createExerciseDto.recommendation,
          muscleGroups: {
            connect: createExerciseDto.muscleGroupsIds.map(id => ({ id }))
          }
        },
        include: {
          muscleGroups: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })
      const { createdAt, updatedAt, isDeleted, ...newExerciseData } = newExercise;
      return { ...newExerciseData }

    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }

  }

  async findAllExercises(paginationDto: PaginationDto) {
    try {
      const { limit, page } = paginationDto
      const totalExercises = await this.exercise.count({
        where: { isDeleted: false }
      })
      const lastPage = Math.ceil(totalExercises / limit)

      const exercises = await this.exercise.findMany({
        where: { isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          muscleGroups: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })

      return {
        data: exercises.map(({ createdAt, updatedAt, isDeleted, ...exerciseData }) => ({
          ...exerciseData
        })),
        meta: {
          totalExercises,
          page,
          lastPage
        }
      }
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }


  }

  async findExerciseById(id: number) {
    try {
      const exercise = await this.exercise.findUnique({
        where: { id, isDeleted: false },
        include: {
          muscleGroups: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });
      if (!exercise) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Exercise with ID ${id} not found`
        });
      }
      const { createdAt, updatedAt, isDeleted, ...exerciseData } = exercise;
      return { ...exerciseData };
    } catch (error) {
      this.logger.warn(error)
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }

  async updateExercise(id: number, updateExerciseDto: UpdateExerciseDto) {
    try {
      const { muscleGroupsIds, ...exerciseData } = updateExerciseDto;
      const exercise = await this.findExerciseById(id)

      if (updateExerciseDto.name != exercise.name) {
        await this.validateExerciseName(updateExerciseDto.name)
      }
      if (muscleGroupsIds) {
        await this.validateMuscleGroups(muscleGroupsIds)
      }

      const updateExercise = await this.exercise.update({
        where: { id, isDeleted: false },
        data: {
          ...exerciseData,
          ...(muscleGroupsIds && {
            muscleGroups: {
              set: muscleGroupsIds.map(id => ({ id }))
            }
          }),
          updatedAt: new Date()
        },
        include: {
          muscleGroups: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })
      const { createdAt, updatedAt, isDeleted, ...updateExerciseData } = updateExercise
      return { ...updateExerciseData }

    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }

  async removeExercise(id: number) {
    try {

      await this.findExerciseById(id);
      await this.checkExerciseDependencies(id)
  

      const deletedExercise = await this.exercise.update({
        where: { id, isDeleted: false },
        data: {
          isDeleted: true,
          updatedAt: new Date()
        },
      });
      return {
        id: deletedExercise.id,
        message: 'Exercise plan deleted successfully'
      };

    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }
  private async validateExerciseName(name: string): Promise<void> {
    const exercise = await this.exercise.findFirst({
      where: { name, isDeleted: false }
    });

    if (exercise) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Exercise with this name already exists'
      });
    }
  }
  private async validateMuscleGroups(muscleGroupIds: number[]): Promise<void> {
    const existingMucleGroups = await this.muscleGroup.findMany({
      where: {
        id: { in: muscleGroupIds },
        isDeleted: false
      }
    })
    if (existingMucleGroups.length !== muscleGroupIds.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'One or more muscle group do not exist or are deleted'
      });
    }
  }

  private async checkExerciseDependencies(id: number): Promise<void> {

    const workoutsCount = await this.exerciseInWorkout.count({
      where: {
        isDeleted: false,
        exerciseId: id
      }
    });
    console.log(workoutsCount)

    if (workoutsCount > 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Cannot delete exercise with associated workouts'
      });
    }
  }
}
