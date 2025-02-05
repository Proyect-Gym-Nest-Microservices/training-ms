import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RateDto } from 'src/common/dto/rate.dto';

@Injectable()
export class EquipmentService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Equipment-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('DataBase connected');
  }

  private async validateEquipmentName(name: string): Promise<void> {
    const existingEquipment = await this.equipment.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, isDeleted: false }
    });

    if (existingEquipment) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Equipment name already exists'
      });
    }
  }

  async createEquipment(createEquipmentDto: CreateEquipmentDto) {
    try {
      await this.validateEquipmentName(createEquipmentDto.name);

      const newEquipment = await this.equipment.create({
        data: {
          name: createEquipmentDto.name,
          mediaUrl: createEquipmentDto.mediaUrl,
          description: createEquipmentDto.description,
          category: createEquipmentDto.category,
          status: createEquipmentDto.status,
        }
      });

      const { createdAt, updatedAt, isDeleted, ...equipmentData } = newEquipment;
      return { ...equipmentData };

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

  async findAllEquipment(paginationDto: PaginationDto) {
    try {
      const { limit, page } = paginationDto;
      const totalEquipments = await this.equipment.count({
        where: { isDeleted: false }
      });
      const lastPage = Math.ceil(totalEquipments / limit);

      const equipment = await this.equipment.findMany({
        where: { isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          mediaUrl: true,
          description: true,
          category: true,
          status: true,
          score: true,
          totalRatings:true
        }
      });

      return {
        data: equipment,
        meta: {
          totalEquipments,
          page,
          lastPage
        }
      };

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }

  async findEquipmentById(id: number) {
    try {
      const equipment = await this.equipment.findUnique({
        where: { id, isDeleted: false },
        select: {
          id: true,
          name: true,
          mediaUrl: true,
          description: true,
          category: true,
          status: true,
          score: true,
          totalRatings:true
        }
      });

      if (!equipment) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Equipment not found'
        });
      }

      return equipment;

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

  async rateEquipment(rateDto: RateDto) {
    const { score, totalRatings, targetId:equipmentId } = rateDto;

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

      const equipment = await this.equipment.findUnique({
        where: {id: equipmentId,isDeleted: false},
        select: {id: true,score: true,totalRatings: true}
      });

      if (!equipment) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Equipment not found'
        });
      }


      const updatedEquipment = await this.equipment.update({
        where: { id: equipmentId },
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

      return updatedEquipment;
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

  async updateEquipment(id: number, updateEquipmentDto: UpdateEquipmentDto) {
    try {
      const existingEquipment = await this.findEquipmentById(id);

      if (updateEquipmentDto.name !== existingEquipment.name) {
        await this.validateEquipmentName(updateEquipmentDto.name);
      }

      const updatedEquipment = await this.equipment.update({
        where: { id },
        data: updateEquipmentDto
      });

      const { createdAt, updatedAt, isDeleted, ...equipmentData } = updatedEquipment;
      return { ...equipmentData };

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

  async removeEquipment(id: number) {
    try {
      const equipment = await this.findEquipmentById(id);
      await this.checkEquipmentDependencies(id);

      const deletedEquipment = await this.equipment.update({
        where: { id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          name: `${equipment.name}_deleted_${equipment.id}`
        }
      });

      return {
        id: deletedEquipment.id,
        message: 'Equipment deleted successfully'
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

  private async checkEquipmentDependencies(id: number): Promise<void> {
    const exercises = await this.exercise.findMany({
      where: {
        isDeleted: false,
        equipments: {
          some: {
            id
          }
        }
      },
      select: {
        id: true
      }
    });

    if (exercises.length > 0) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Cannot delete equipment with associated exercises. Affected exercises: ${exercises.map(exercise => exercise.id).join(', ')}`
      });
    }
  }
}
