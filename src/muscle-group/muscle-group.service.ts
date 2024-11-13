import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateMuscleGroupDto } from './dto/create-muscle-group.dto';
import { UpdateMuscleGroupDto } from './dto/update-muscle-group.dto';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class MuscleGroupService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Muscle-Group-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('DataBase connected');
  }

  private async validateMuscleGroupName(name: string): Promise<void> {
    const existingMuscleGroup = await this.muscleGroup.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, isDeleted: false }
    });

    if (existingMuscleGroup) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Muscle group name already exists'
      });
    }
  }

  async createMuscleGroup(createMuscleGroupDto: CreateMuscleGroupDto) {
    try {
      await this.validateMuscleGroupName(createMuscleGroupDto.name);

      const newMuscleGroup = await this.muscleGroup.create({
        data: {
          name: createMuscleGroupDto.name,
          description: createMuscleGroupDto.description,
        }
      });

      const { createdAt, updatedAt, isDeleted, ...muscleGroupData } = newMuscleGroup;
      return { ...muscleGroupData };

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

  async findAllMuscleGroup(paginationDto: PaginationDto) {
    try {
      const { limit, page } = paginationDto
      const totalMuscleGroups = await this.muscleGroup.count({
        where: { isDeleted: false }
      })
      const lastPage = Math.ceil(totalMuscleGroups / limit)

      const muscleGroup = await this.muscleGroup.findMany({
        where: { isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
        }
      })
      return {
        data: muscleGroup,
        meta: {
          totalMuscleGroups,
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

  async findMuscleGroupById(id: number) {
    try {
      const muscleGroup = await this.muscleGroup.findUnique({
        where: { id, isDeleted: false },
        select: {
          id: true,
          name: true,
          description: true,
        }
      });

      if (!muscleGroup) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Muscle group not found'
        });
      }

      return muscleGroup;

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

  async updateMuscleGroup(id: number, updateMuscleGroupDto: UpdateMuscleGroupDto) {
    try {

      const existingMuscleGroup= await this.findMuscleGroupById(id)

      if (updateMuscleGroupDto.name !== existingMuscleGroup.name) {
        await this.validateMuscleGroupName(updateMuscleGroupDto.name);
      }

      const updatedMuscleGroup = await this.muscleGroup.update({
        where: { id },
        data: updateMuscleGroupDto
      });

      const { createdAt, updatedAt, ...muscleGroupData } = updatedMuscleGroup;
      return {...muscleGroupData};

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

  async removeMuscleGroup(id: number) {
    try {

      const muscle= await this.findMuscleGroupById(id)
      await this.checkMuscleGroupDependencies(id)

      const deletedMuscleGroup = await this.muscleGroup.update({
        where: { id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          name:`${muscle.name}_deleted_${muscle.id}`
        }
      });
      
      return {
        id: deletedMuscleGroup.id,
        message: 'Muscle Group deleted successfully'
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

  private async checkMuscleGroupDependencies(id: number): Promise<void> {

    const exercisesCount = await this.exercise.count({
      where: {
        isDeleted:false,
        muscleGroups: {
          some: {
            id
          }
        }
      }
    });
  
    if (exercisesCount > 0) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message:'Cannot delete muscle group with associated exercises'
      });
    }
  }
}
