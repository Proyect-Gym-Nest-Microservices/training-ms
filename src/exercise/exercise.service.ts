import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common';
import { RateDto } from 'src/common/dto/rate.dto';

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
      await this.validateEquipments(createExerciseDto.equipmentIds)

      const newExercise = await this.exercise.create({
        data: {
          name: createExerciseDto.name,
          mediaUrl: createExerciseDto.mediaUrl,
          level: createExerciseDto.level,
          category: createExerciseDto.category,
          description: createExerciseDto.description,
          recommendation: createExerciseDto.recommendation,
          muscleGroups: {
            connect: createExerciseDto.muscleGroupsIds.map(id => ({ id }))
          },
          equipments: {
            connect: createExerciseDto.equipmentIds.map(id => ({ id }))
          }

        },
        include: {
          muscleGroups: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          equipments: {
            select: {
              id: true,
              name: true,
              description: true,
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
          },
          equipments: {
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
              description: true,
            }
          },
          equipments: {
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

  async rateExercise(rateDto: RateDto) {
    const { score, totalRatings, targetId: exerciseId } = rateDto;
    try {
      if (score < 0 || score > 5) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Rating must be between 0 and 5'
        });
      }

      if (totalRatings < 0) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Total ratings cannot be negative'
        });
      }

      const exercise = await this.exercise.findUnique({
        where: { id: exerciseId, isDeleted: false },
        select: { id: true, score: true, totalRatings: true }
      });

      if (!exercise) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Exercise not found'
        });
      }


      const updatedExercise = await this.exercise.update({
        where: { id: exerciseId },
        data: {
          score,
          totalRatings,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          score: true,
          totalRatings: true,
          updatedAt: true
        }
      });

      return updatedExercise;

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


  async updateExercise(id: number, updateExerciseDto: UpdateExerciseDto) {
    try {
      const { muscleGroupsIds, equipmentIds, ...exerciseData } = updateExerciseDto;
      const exercise = await this.findExerciseById(id)

      if (updateExerciseDto.name != exercise.name) {
        await this.validateExerciseName(updateExerciseDto.name)
      }
      if (muscleGroupsIds) {
        await this.validateMuscleGroups(muscleGroupsIds)
      }

      if (equipmentIds) {
        await this.validateEquipments(equipmentIds)
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
          ...(equipmentIds && {
            equipments: {
              set: equipmentIds.map(id => ({ id }))
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
          },
          equipments: {
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

      const exercise = await this.findExerciseById(id);
      await this.checkExerciseDependencies(id)


      const deletedExercise = await this.exercise.update({
        where: { id, isDeleted: false },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          name: `${exercise.name}_deleted_${id}`
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
  private async validateEquipments(equipmentIds: number[]): Promise<void> {

    const existingEquipments = await this.equipment.findMany({
      where: {
        id: { in: equipmentIds },
        isDeleted: false
      }
    })
    if (existingEquipments.length !== equipmentIds.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'One or more equipments do not exist or are deleted'
      });
    }
  }

  private async checkExerciseDependencies(id: number): Promise<void> {

    const workouts = await this.exerciseInWorkout.findMany({
      where: {
        isDeleted: false,
        exerciseId: id
      },
      select: {
        id: true
      }
    });

    if (workouts.length > 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Cannot delete exercise with associated workouts. Affected workouts: ${workouts.map(workout => workout.id).join(', ')}`
      });
    }
  }
}
