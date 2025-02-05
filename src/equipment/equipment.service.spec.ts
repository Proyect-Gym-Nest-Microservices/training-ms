import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { RpcException } from '@nestjs/microservices';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { RateDto } from '../common/dto/rate.dto';
import { EquipmentCategory } from './enums/categories.enum';
import { EquipmentStatus } from './enums/status.enum';

// Mock Prisma Client
const prismaServiceMock = {
  equipment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  exercise: {
    findMany: jest.fn(),
  },
  $connect: jest.fn(),
  $transaction: jest.fn((callback) => callback(prismaServiceMock)),
};

describe('EquipmentService', () => {
  let service: EquipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquipmentService],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
    // Replace Prisma instance with mock
    Object.assign(service, prismaServiceMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEquipment', () => {
    const createEquipmentDto: CreateEquipmentDto = {
      name: 'Test Equipment',
      description: 'Test Description',
      mediaUrl: 'http://test.com/image.jpg',
      category: EquipmentCategory.MACHINE,
      status: EquipmentStatus.AVAILABLE,
    };

    it('should create equipment successfully', async () => {
      // Mock name validation
      prismaServiceMock.equipment.findFirst.mockResolvedValue(null);

      // Mock creation
      prismaServiceMock.equipment.create.mockResolvedValue({
        id: 1,
        ...createEquipmentDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });

      const result = await service.createEquipment(createEquipmentDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createEquipmentDto.name);
      expect(result.category).toBe(createEquipmentDto.category);
      expect(result.status).toBe(createEquipmentDto.status);
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
      expect(result).not.toHaveProperty('isDeleted');
    });

    it('should throw if equipment name already exists (case insensitive)', async () => {
      prismaServiceMock.equipment.findFirst.mockResolvedValue({
        id: 1,
        name: 'test equipment'
      });

      await expect(service.createEquipment(createEquipmentDto))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('findAllEquipment', () => {
    const paginationDto = { page: 1, limit: 10 };

    it('should return paginated equipment', async () => {
      const equipment = [
        { 
          id: 1, 
          name: 'Equipment 1',
          category: EquipmentCategory.MACHINE,
          status: EquipmentStatus.AVAILABLE,
        },
        { 
          id: 2, 
          name: 'Equipment 2',
          category: EquipmentCategory.FREE_WEIGHT,
          status: EquipmentStatus.AVAILABLE,
        }
      ];

      prismaServiceMock.equipment.count.mockResolvedValue(2);
      prismaServiceMock.equipment.findMany.mockResolvedValue(equipment);

      const result = await service.findAllEquipment(paginationDto);

      expect(result.data).toHaveLength(2);
      expect(result.meta.totalEquipments).toBe(2);
      expect(result.meta.page).toBe(paginationDto.page);
      expect(result.meta.lastPage).toBe(1);
    });

    it('should handle empty result', async () => {
      prismaServiceMock.equipment.count.mockResolvedValue(0);
      prismaServiceMock.equipment.findMany.mockResolvedValue([]);

      const result = await service.findAllEquipment(paginationDto);

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalEquipments).toBe(0);
      expect(result.meta.lastPage).toBe(0);
    });
  });

  describe('findEquipmentById', () => {
    it('should return equipment if found', async () => {
      const equipment = {
        id: 1,
        name: 'Test Equipment',
        category: EquipmentCategory.MACHINE,
        status: EquipmentStatus.AVAILABLE,
        isDeleted: false,
      };

      prismaServiceMock.equipment.findUnique.mockResolvedValue(equipment);

      const result = await service.findEquipmentById(1);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Test Equipment');
      expect(result).toHaveProperty('category', EquipmentCategory.MACHINE);
      expect(result).toHaveProperty('status', EquipmentStatus.AVAILABLE);
    });

    it('should throw if equipment not found', async () => {
      prismaServiceMock.equipment.findUnique.mockResolvedValue(null);

      await expect(service.findEquipmentById(999))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('rateEquipment', () => {
    const rateDto: RateDto = {
      targetId: 1,
      score: 4.5,
      totalRatings: 10,
    };

    it('should rate equipment successfully', async () => {
      prismaServiceMock.equipment.findUnique.mockResolvedValue({
        id: 1,
        score: 4.0,
        totalRatings: 9,
      });

      prismaServiceMock.equipment.update.mockResolvedValue({
        id: 1,
        name: 'Test Equipment',
        score: rateDto.score,
        totalRatings: rateDto.totalRatings,
        updatedAt: new Date(),
      });

      const result = await service.rateEquipment(rateDto);

      expect(result.score).toBe(rateDto.score);
      expect(result.totalRatings).toBe(rateDto.totalRatings);
    });

    it('should throw if score is invalid', async () => {
      const invalidRateDto = { ...rateDto, score: 6 };

      await expect(service.rateEquipment(invalidRateDto))
        .rejects
        .toThrow(RpcException);
    });

    it('should throw if total ratings is negative', async () => {
      const invalidRateDto = { ...rateDto, totalRatings: -1 };

      await expect(service.rateEquipment(invalidRateDto))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('updateEquipment', () => {
    const updateEquipmentDto: UpdateEquipmentDto = {
      name: 'Updated Equipment',
      status: EquipmentStatus.IN_MAINTENANCE,
    };

    it('should update equipment successfully', async () => {
      // Mock existing equipment
      prismaServiceMock.equipment.findUnique.mockResolvedValue({
        id: 1,
        name: 'Old Name',
        status: EquipmentStatus.AVAILABLE,
        isDeleted: false,
      });

      // Mock name validation
      prismaServiceMock.equipment.findFirst.mockResolvedValue(null);

      // Mock update
      prismaServiceMock.equipment.update.mockResolvedValue({
        id: 1,
        ...updateEquipmentDto,
        updatedAt: new Date(),
        isDeleted: false,
      });

      const result = await service.updateEquipment(1, updateEquipmentDto);

      expect(result).toHaveProperty('name', updateEquipmentDto.name);
      expect(result).toHaveProperty('status', updateEquipmentDto.status);
    });

    it('should throw if new name already exists', async () => {
      // Mock existing equipment
      prismaServiceMock.equipment.findUnique.mockResolvedValue({
        id: 1,
        name: 'Old Name',
        isDeleted: false,
      });

      // Mock name validation failure
      prismaServiceMock.equipment.findFirst.mockResolvedValue({
        id: 2,
        name: 'Updated Equipment',
      });

      await expect(service.updateEquipment(1, updateEquipmentDto))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('removeEquipment', () => {
    it('should soft delete equipment successfully', async () => {
      // Mock existing equipment
      prismaServiceMock.equipment.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Equipment',
        isDeleted: false,
      });

      // Mock no dependencies
      prismaServiceMock.exercise.findMany.mockResolvedValue([]);

      // Mock successful deletion
      prismaServiceMock.equipment.update.mockResolvedValue({
        id: 1,
        isDeleted: true,
        name: 'Test Equipment_deleted_1',
      });

      const result = await service.removeEquipment(1);

      expect(result).toHaveProperty('message', 'Equipment deleted successfully');
      expect(result).toHaveProperty('id', 1);
    });

    it('should throw if equipment has exercise dependencies', async () => {
      prismaServiceMock.equipment.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Equipment',
        isDeleted: false,
      });

      prismaServiceMock.exercise.findMany.mockResolvedValue([{ id: 1 }]);

      await expect(service.removeEquipment(1))
        .rejects
        .toThrow(RpcException);
    });
  });

  // Integration test
  describe('Integration Tests', () => {
    it('should handle complete equipment lifecycle', async () => {
      // 1. Create equipment
      const createDto: CreateEquipmentDto = {
        name: 'Lifecycle Test Equipment',
        description: 'Test Description',
        mediaUrl: 'http://test.com/image.jpg',
        category: EquipmentCategory.MACHINE,
        status: EquipmentStatus.AVAILABLE,
      };

      prismaServiceMock.equipment.findFirst.mockResolvedValue(null);
      prismaServiceMock.equipment.create.mockResolvedValue({
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });

      const created = await service.createEquipment(createDto);
      expect(created).toHaveProperty('id');

      // 2. Update equipment
      const updateDto: UpdateEquipmentDto = {
        name: 'Updated Lifecycle Equipment',
        status: EquipmentStatus.IN_MAINTENANCE,
      };

      prismaServiceMock.equipment.update.mockResolvedValue({
        ...created,
        ...updateDto,
      });

      const updated = await service.updateEquipment(created.id, updateDto);
      expect(updated.name).toBe(updateDto.name);
      expect(updated.status).toBe(updateDto.status);

      // 3. Rate equipment
      const rateDto: RateDto = {
        targetId: created.id,
        score: 4.5,
        totalRatings: 1,
      };

      prismaServiceMock.equipment.findUnique.mockResolvedValue(updated);
      prismaServiceMock.equipment.update.mockResolvedValue({
        ...updated,
        score: rateDto.score,
        totalRatings: rateDto.totalRatings,
      });

      const rated = await service.rateEquipment(rateDto);
      expect(rated.score).toBe(rateDto.score);

      // 4. Remove equipment
      prismaServiceMock.exercise.findMany.mockResolvedValue([]);
      prismaServiceMock.equipment.update.mockResolvedValue({
        ...rated,
        isDeleted: true,
        name: `${rated.name}_deleted_${rated.id}`,
      });

      const removed = await service.removeEquipment(created.id);
      expect(removed.message).toContain('successfully');
    });
  });
});