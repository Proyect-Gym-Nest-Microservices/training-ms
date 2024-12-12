import { Workout } from './../../node_modules/.prisma/client/index.d';
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common';

@Injectable()
export class WorkoutService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Workout-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('DataBase connected');
  }

  async createWorkout(createWorkoutDto: CreateWorkoutDto) {
    const { exercisesInWorkout, ...workoutData } = createWorkoutDto;
    try {
      await this.validateWorkoutName(createWorkoutDto.name)
      await this.validateExercises(exercisesInWorkout)
      this.validateExerciseOrders(exercisesInWorkout)

      const newWorkout = await this.workout.create({
        data: {
          ...workoutData,
          exercisesInWorkout: {
            create: exercisesInWorkout.map(exercise => ({
              exercise: {
                connect: { id: exercise.exerciseId }
              },
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              restTime: exercise.restTime,
              order: exercise.order
            }))
          }
        },
        include: {
          exercisesInWorkout: {
            select: {
              id: true,
              exerciseId: true,
              workoutId: true,
              sets: true,
              reps: true,
              weight: true,
              restTime: true,
              order: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      })
      const { createdAt, updatedAt, ...newWorkoutData } = newWorkout;

      return { ...newWorkoutData }

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

  async findAllWorkouts(paginationDto: PaginationDto) {
    try {
      const { limit, page } = paginationDto
      const totalWorkouts = await this.workout.count({
        where: { isDeleted: false }
      })
      const lastPage = Math.ceil(totalWorkouts / limit)

      const workouts = await this.workout.findMany({
        where: { isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          exercisesInWorkout: {
            select: {
              id: true,
              exerciseId: true,
              workoutId: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      })

      return {
        data: workouts.map(({ createdAt, updatedAt, ...workoutData }) => ({
          ...workoutData
        })),
        meta: {
          totalWorkouts,
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


  async findExerciseInWorkoutById(id: number) {
    try {
      const exerciseInWorkout = await this.exerciseInWorkout.findUnique({
        where: { id, isDeleted: false },
      });
      if (!exerciseInWorkout) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `exerciseInWorkout not found`
        });
      }
      const { isDeleted, createdAt, updatedAt, ...exerciseData } = exerciseInWorkout
      return exerciseData;
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

  async findWorkoutById(id: number) {
    try {
      const workout = await this.workout.findUnique({
        where: { id, isDeleted: false },
        include: {
          exercisesInWorkout: {
            select: {
              id: true,
              workoutId: true,
              sets: true,
              reps: true,
              weight: true,
              restTime: true,
              order: true,
              exercise: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  equipments: {
                    select: {
                      id: true,
                      name: true,
                      mediaUrl: true,
                      description: true,
                      category: true,
                      status: true
                    }
                  },
                  level: true,
                  mediaUrl: true,
                  recommendation: true,
                  muscleGroups: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      mediaUrl: true,
                      
                    }
                  }
                }
              }
            }
          }
        }
      });
      if (!workout) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Workout not found`
        });
      }
      const { createdAt, updatedAt, ...workoutData } = workout;
      return {
        ...workoutData
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

  async findWorkoutByIds(ids: number[]) {
    try {
      const workouts = await this.workout.findMany({
        where: {
          id: { in: ids },
          isDeleted: false,
        },
        include: {
          exercisesInWorkout: {
            select: {
              id: true,
              workoutId: true,
              sets: true,
              reps: true,
              weight: true,
              restTime: true,
              order: true,
              exercise: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  equipments: {
                    select: {
                      id: true,
                      name: true,
                      mediaUrl: true,
                      description: true,
                      category: true,
                      status: true,
                    },
                  },
                  level: true,
                  mediaUrl: true,
                  recommendation: true,
                  muscleGroups: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      mediaUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const existingIds = workouts.map(workout => workout.id);
      const missingIds = ids.filter(id => !existingIds.includes(id));
  
      if (missingIds.length > 0) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Workouts not found for IDs: ${missingIds.join(', ')}`,
        });
      }
  
      return workouts.map(({ createdAt, updatedAt, ...workoutData }) => workoutData);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
  

  async updateWorkout(id: number, updateWorkoutDto: UpdateWorkoutDto) {
    const { exercisesInWorkout, ...updateWorkoutDtoData } = updateWorkoutDto;

    try {
      const workout = await this.findWorkoutById(id);
      if (updateWorkoutDto.name !== workout.name) {
        await this.validateWorkoutName(updateWorkoutDto.name);
      }
      if (exercisesInWorkout) {
        await this.validateExercises(exercisesInWorkout);
        this.validateExerciseOrders(exercisesInWorkout);
      }
      const updateWorkout = await this.workout.update({
        where: { id, isDeleted: false },
        data: {
          ...updateWorkoutDtoData,
          updatedAt: new Date(),
          exercisesInWorkout: exercisesInWorkout ? {
            deleteMany: {},
            create: exercisesInWorkout.map(exercise => ({
              exercise: {
                connect: { id: exercise.exerciseId }
              },
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              restTime: exercise.restTime,
              order: exercise.order
            }))
          } : undefined
        },
        include: {
          exercisesInWorkout: {
            select: {
              id: true,
              exerciseId: true,
              workoutId: true,
              sets: true,
              reps: true,
              weight: true,
              restTime: true,
              order: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      })
      const { createdAt, updatedAt, ...updateWorkoutData } = updateWorkout
      return { ...updateWorkoutData }
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

  async removeWorkout(id: number) {
    try {
      const workout = await this.findWorkoutById(id);
      await this.checkWorkoutDependencies(id);


      return await this.$transaction(async (prisma) => {

        const deletedWorkout = await prisma.workout.update({
          where: { id, isDeleted: false },
          data: {
            isDeleted: true,
            updatedAt: new Date(),
            name: `${workout.name}_deleted_${workout.id}`
          }
        });

        await prisma.exerciseInWorkout.updateMany({
          where: { workoutId: id },
          data: { isDeleted: true, updatedAt: new Date() }
        });

        return {
          message: 'Workout deleted successfully',
          id: deletedWorkout.id
        };
      });

    } catch (error) {
      this.logger.error(error)
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }


  private async validateWorkoutName(name: string): Promise<void> {
    const workout = await this.workout.findFirst({
      where: { name, isDeleted: false }
    });

    if (workout) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Workout with this name already exists'
      });
    }
  }

  private async validateExercises(exercises: any[]): Promise<void> {
    const exerciseIds = exercises.map(e => e.exerciseId);
    const existingExercises = await this.exercise.findMany({
      where: {
        id: { in: exerciseIds },
        isDeleted: false,
      },
    });

    if (existingExercises.length !== exerciseIds.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'One or more exercises do not exist or are deleted'
      });
    }
  }

  private validateExerciseOrders(exercises: any[]): void {
    const orders = exercises.map(e => e.order);
    if (new Set(orders).size !== orders.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Duplicate exercise orders are not allowed'
      });
    }
  }

  private async checkWorkoutDependencies(id: number): Promise<void> {
    const trainingPlans = await this.trainingPlan.findMany({
      where: {
        isDeleted: false,
        workouts: {
          some: {
            id
          }
        }
      },
      select: {
        id: true 
      }
    });
  
    if (trainingPlans.length > 0) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Cannot delete workout with associated training plans. Affected training plans: ${trainingPlans.map(plan => plan.id).join(', ')}`
      });
    }
  }
}
