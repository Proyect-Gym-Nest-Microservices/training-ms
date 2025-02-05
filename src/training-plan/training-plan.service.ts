import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RateDto } from 'src/common/dto/rate.dto';

@Injectable()
export class TrainingPlanService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Training-Plan-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('DataBase connected');
  }

  async createTrainingPlan(createTrainingPlanDto: CreateTrainingPlanDto) {
    try {
      await this.validateTrainingPlanName(createTrainingPlanDto.name)
      await this.validateWorkouts(createTrainingPlanDto.workoutsIds)
      const newTrainingPlan = await this.trainingPlan.create({
        data: {
          name: createTrainingPlanDto.name,
          level: createTrainingPlanDto.level,
          description: createTrainingPlanDto.description,
          startDate: createTrainingPlanDto.startDate,
          endDate: createTrainingPlanDto.endDate,
          workouts: {
            connect: createTrainingPlanDto.workoutsIds.map(id => ({ id }))
          }
        },
        include: {
          workouts: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        }
      })
      const { createdAt, updatedAt, isDeleted, ...trainingPlanData } = newTrainingPlan
      return { ...trainingPlanData }
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

  async findAllTrainingPlan(paginationDto: PaginationDto) {
    try {
      const { limit, page } = paginationDto;
      const totalTrainingPlans = await this.trainingPlan.count({
        where: { isDeleted: false }
      })
      const lastPage = Math.ceil(totalTrainingPlans / limit)
      const trainingPlans = await this.trainingPlan.findMany({
        where: { isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          workouts: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        }
      })

      return {
        data: trainingPlans.map(({ createdAt, updatedAt, isDeleted, ...traningPlanData }) => ({
          ...traningPlanData
        })),
        meta: {
          totalTrainingPlans,
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

  async findTrainingPlanById(id: number) {
    try {
      const trainingPlan = await this.trainingPlan.findUnique({
        where: { id, isDeleted: false },
        include: {
          workouts: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        }
      })

      if (!trainingPlan) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Training plan not found'
        });
      }
      const { createdAt, updatedAt, isDeleted, ...trainingPlanData } = trainingPlan
      return { ...trainingPlanData }

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


  async findTrainingPlanByIds(ids: number[]) {
    try {
      const trainingPlans = await this.trainingPlan.findMany({
        where: {
          id: { in: ids },
          isDeleted: false,
        },
        include: {
          workouts: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      if (!trainingPlans || trainingPlans.length === 0) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Training Plan not found for IDs: ${ids.join(', ')}`,
        });
      }

      const existingIds = trainingPlans.map(plan => plan.id);
      const missingIds = ids.filter(id => !existingIds.includes(id));

      if (missingIds.length > 0) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Training plans not found for IDs: ${missingIds.join(', ')}`,
        });
      }

      return trainingPlans.map(({ createdAt, updatedAt, isDeleted, ...trainingPlanData }) => trainingPlanData);
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


  async rateTrainingPlan(rateDto: RateDto) {
    const { score, totalRatings, targetId:trainingId } = rateDto;

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

      const trainingPlan = await this.trainingPlan.findUnique({
        where: {id: trainingId,isDeleted: false},
        select: {id: true,score: true,totalRatings: true}
      });

      if (!trainingPlan) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Training Plan not found'
        });
      }


      const updatedTrainingPlan = await this.trainingPlan.update({
        where: { id: trainingId },
        data: {score,totalRatings,updatedAt: new Date()
        },
        select: {id: true,name: true,score: true,totalRatings: true}
      });

      return updatedTrainingPlan;

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

  async updateTrainingPlan(id: number, updateTrainingPlanDto: UpdateTrainingPlanDto) {
    const { workoutsIds, ...updateTrainingDtoData } = updateTrainingPlanDto
    try {
      const trainingPlan = await this.findTrainingPlanById(id)
      if (updateTrainingPlanDto.name !== trainingPlan.name) {
        await this.validateTrainingPlanName(updateTrainingPlanDto.name)
      }
      if (workoutsIds) {
        await this.validateWorkouts(workoutsIds)
      }
      const updatedPlan = await this.trainingPlan.update({
        where: { id, isDeleted: false },
        data: {
          ...updateTrainingDtoData,
          workouts: workoutsIds ? {
            set: [],
            connect: workoutsIds.map(id => ({ id }))
          } : undefined
        },
        include: {
          workouts: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });
      const { createdAt, updatedAt, isDeleted, ...updatedPlanDto } = updatedPlan
      return { ...updatedPlanDto }
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

  async removeTrainingPlan(id: number) {
    try {
      const plan = await this.findTrainingPlanById(id);

      const deletedPlan = await this.trainingPlan.update({
        where: { id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          name: `${plan.name}_deleted_${plan.id}`
        }
      });

      return {
        id: deletedPlan.id,
        message: 'Training plan deleted successfully'
      }
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

  private async validateTrainingPlanName(name: string): Promise<void> {
    const exercise = await this.trainingPlan.findFirst({
      where: { name, isDeleted: false }
    });
    if (exercise) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Exercise with this name already exists'
      });
    }
  }

  private async validateWorkouts(workoutIds: number[]): Promise<void> {
    const existingWorkouts = await this.workout.findMany({
      where: {
        id: { in: workoutIds },
        isDeleted: false
      }
    })
    if (existingWorkouts.length !== workoutIds.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'One or more workouts do not exist or are deleted'
      });
    }
  }
}
