import { Test, TestingModule } from '@nestjs/testing';
import { MuscleGroupService } from './muscle-group.service';
import { RpcException } from '@nestjs/microservices';
import { CreateMuscleGroupDto } from './dto/create-muscle-group.dto';
import { UpdateMuscleGroupDto } from './dto/update-muscle-group.dto';

// Mock Prisma Client
const prismaServiceMock = {
  muscleGroup: {
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

describe('MuscleGroupService', () => {
  let service: MuscleGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MuscleGroupService],
    }).compile();

    service = module.get<MuscleGroupService>(MuscleGroupService);
    // Replace Prisma instance with mock
    Object.assign(service, prismaServiceMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMuscleGroup', () => {
    const createMuscleGroupDto: CreateMuscleGroupDto = {
      name: 'Test Muscle Group',
      description: 'Test Description',
      mediaUrl: 'http://test.com/image.jpg'
    };

    it('should create a muscle group successfully', async () => {
      // Mock name validation
      prismaServiceMock.muscleGroup.findFirst.mockResolvedValue(null);

      // Mock creation
      prismaServiceMock.muscleGroup.create.mockResolvedValue({
        id: 1,
        ...createMuscleGroupDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });

      const result = await service.createMuscleGroup(createMuscleGroupDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createMuscleGroupDto.name);
      expect(result.mediaUrl).toBe(createMuscleGroupDto.mediaUrl);
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
      expect(result).not.toHaveProperty('isDeleted');
    });

    it('should throw if muscle group name already exists (case insensitive)', async () => {
      prismaServiceMock.muscleGroup.findFirst.mockResolvedValue({
        id: 1,
        name: 'test muscle group'
      });

      await expect(service.createMuscleGroup(createMuscleGroupDto))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('findAllMuscleGroup', () => {
    const paginationDto = { page: 1, limit: 10 };

    it('should return paginated muscle groups', async () => {
      const muscleGroups = [
        { id: 1, name: 'Group 1', description: 'Desc 1' },
        { id: 2, name: 'Group 2', description: 'Desc 2' }
      ];

      prismaServiceMock.muscleGroup.count.mockResolvedValue(2);
      prismaServiceMock.muscleGroup.findMany.mockResolvedValue(muscleGroups);

      const result = await service.findAllMuscleGroup(paginationDto);

      expect(result.data).toHaveLength(2);
      expect(result.meta.totalMuscleGroups).toBe(2);
      expect(result.meta.page).toBe(paginationDto.page);
      expect(result.meta.lastPage).toBe(1);
    });

    it('should handle empty result', async () => {
      prismaServiceMock.muscleGroup.count.mockResolvedValue(0);
      prismaServiceMock.muscleGroup.findMany.mockResolvedValue([]);

      const result = await service.findAllMuscleGroup(paginationDto);

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalMuscleGroups).toBe(0);
      expect(result.meta.lastPage).toBe(0);
    });
  });

  describe('findMuscleGroupById', () => {
    it('should return a muscle group if found', async () => {
      const muscleGroup = {
        id: 1,
        name: 'Test Group',
        description: 'Test Description',
        isDeleted: false
      };

      prismaServiceMock.muscleGroup.findUnique.mockResolvedValue(muscleGroup);

      const result = await service.findMuscleGroupById(1);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Test Group');
    });

    it('should throw if muscle group not found', async () => {
      prismaServiceMock.muscleGroup.findUnique.mockResolvedValue(null);

      await expect(service.findMuscleGroupById(999))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('updateMuscleGroup', () => {
    const updateMuscleGroupDto: UpdateMuscleGroupDto = {
      name: 'Updated Group',
      description: 'Updated Description'
    };

    it('should update muscle group successfully', async () => {
      // Mock existing group
      prismaServiceMock.muscleGroup.findUnique.mockResolvedValue({
        id: 1,
        name: 'Old Name',
        description: 'Old Description',
        isDeleted: false
      });

      // Mock name validation (when name changes)
      prismaServiceMock.muscleGroup.findFirst.mockResolvedValue(null);

      // Mock update
      prismaServiceMock.muscleGroup.update.mockResolvedValue({
        id: 1,
        ...updateMuscleGroupDto,
        updatedAt: new Date(),
        isDeleted: false
      });

      const result = await service.updateMuscleGroup(1, updateMuscleGroupDto);

      expect(result).toHaveProperty('name', updateMuscleGroupDto.name);
      expect(result).toHaveProperty('description', updateMuscleGroupDto.description);
    });

    it('should throw if new name already exists', async () => {
      // Mock existing group
      prismaServiceMock.muscleGroup.findUnique.mockResolvedValue({
        id: 1,
        name: 'Old Name',
        isDeleted: false
      });

      // Mock name validation failure
      prismaServiceMock.muscleGroup.findFirst.mockResolvedValue({
        id: 2,
        name: 'Updated Group'
      });

      await expect(service.updateMuscleGroup(1, updateMuscleGroupDto))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('removeMuscleGroup', () => {
    it('should soft delete muscle group successfully', async () => {
      // Mock existing group
      prismaServiceMock.muscleGroup.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Group',
        isDeleted: false
      });

      // Mock no dependencies
      prismaServiceMock.exercise.findMany.mockResolvedValue([]);

      // Mock successful deletion
      prismaServiceMock.muscleGroup.update.mockResolvedValue({
        id: 1,
        isDeleted: true,
        name: 'Test Group_deleted_1'
      });

      const result = await service.removeMuscleGroup(1);

      expect(result).toHaveProperty('message', 'Muscle Group deleted successfully');
      expect(result).toHaveProperty('id', 1);
    });

    it('should throw if muscle group has associated exercises', async () => {
      // Mock existing group
      prismaServiceMock.muscleGroup.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Group',
        isDeleted: false
      });

      // Mock dependencies
      prismaServiceMock.exercise.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 }
      ]);

      await expect(service.removeMuscleGroup(1))
        .rejects
        .toThrow(RpcException);
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('should handle complete muscle group lifecycle', async () => {
      // 1. Create muscle group
      const createDto: CreateMuscleGroupDto = {
        name: 'Lifecycle Test Group',
        description: 'Test Description',
        mediaUrl: 'http://test.com/image.jpg'
      };

      prismaServiceMock.muscleGroup.findFirst.mockResolvedValue(null);
      prismaServiceMock.muscleGroup.create.mockResolvedValue({
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      });

      const created = await service.createMuscleGroup(createDto);
      expect(created).toHaveProperty('id');

      // 2. Update muscle group
      const updateDto: UpdateMuscleGroupDto = {
        name: 'Updated Lifecycle Group',
        description: 'Updated Description'
      };

      prismaServiceMock.muscleGroup.findUnique.mockResolvedValue(created);
      prismaServiceMock.muscleGroup.update.mockResolvedValue({
        ...created,
        ...updateDto
      });

      const updated = await service.updateMuscleGroup(created.id, updateDto);
      expect(updated.name).toBe(updateDto.name);

      // 3. Remove muscle group
      prismaServiceMock.exercise.findMany.mockResolvedValue([]);
      prismaServiceMock.muscleGroup.update.mockResolvedValue({
        ...updated,
        isDeleted: true,
        name: `${updated.name}_deleted_${updated.id}`
      });

      const removed = await service.removeMuscleGroup(created.id);
      expect(removed.message).toContain('successfully');
    });
  });
});