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
      const exercise = await this.exercise.findUnique({
        where: { name: createExerciseDto.name }
      })

      if (exercise) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Exercise with this name already exists'
        });
      }
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
          muscleGroups: true
        }
      })
      return newExercise

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
      console.log(totalExercises)
      const lastPage = Math.ceil(totalExercises / limit)

      return {
        data: await this.exercise.findMany({
          where: { isDeleted: false },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            muscleGroups:true
          }
        }),
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
          muscleGroups: true
        }
      });
      if (!exercise) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Exercise with ID ${id} not found`
        });
      }
      return exercise;
    } catch (error) {
      console.log(error)
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }

  async updateExercise(id:number, updateExerciseDto: UpdateExerciseDto) {
    try {
      const exercise = await this.exercise.findUnique({
        where: { id, isDeleted: false }
      });
      if (!exercise) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Exercise with ID ${id} not found`
        });
      }
      const { muscleGroupsIds,isDeleted, ...exerciseData } = updateExerciseDto;
      const updateExercise = await this.exercise.update({
        where: { id, isDeleted: false },
        data: {
          ...exerciseData,
          ...(muscleGroupsIds && {
            muscleGroups: {
              set:muscleGroupsIds.map(id=>({id}))
            }
          }),
          updatedAt:new Date()
        },
        include: {
          muscleGroups: true
        }
      })
      return updateExercise

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
      const exercise = await this.exercise.findUnique({
        where: { id, isDeleted:false }
      });

      if (!exercise) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Exercise with ID ${id} not found`
        });
      }

      const deletedExercise = await this.exercise.update({
        where: { id, isDeleted: false },
        data: {
          isDeleted: true,
          updatedAt:new Date()
        }
      });

      return deletedExercise;

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
}
