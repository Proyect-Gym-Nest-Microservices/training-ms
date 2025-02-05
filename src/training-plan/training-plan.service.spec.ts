import { Test, TestingModule } from '@nestjs/testing';
import { TrainingPlanService } from './training-plan.service';
import { RpcException } from '@nestjs/microservices';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';
import { RateDto } from '../common/dto/rate.dto';
import { Difficulty } from '../common/enums/difficulties.enum';

// Mock Prisma Client
const prismaServiceMock = {
  trainingPlan: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  workout: {
    findMany: jest.fn(),
  },
  $connect: jest.fn(),
  $transaction: jest.fn((callback) => callback(prismaServiceMock)),
};

describe('TrainingPlanService', () => {
  let service: TrainingPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingPlanService],
    }).compile();

    service = module.get<TrainingPlanService>(TrainingPlanService);
    // Replace Prisma instance with mock
    Object.assign(service, prismaServiceMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTrainingPlan', () => {
    const createTrainingPlanDto: CreateTrainingPlanDto = {
      name: 'Test Training Plan',
      level: Difficulty.BASIC,
      description: 'Test Description',
      startDate: new Date(),
      workoutsIds: [1, 2],
    };

    it('should create a training plan successfully', async () => {
      // Mock validations
      prismaServiceMock.trainingPlan.findFirst.mockResolvedValue(null);
      prismaServiceMock.workout.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      // Mock creation
      prismaServiceMock.trainingPlan.create.mockResolvedValue({
        id: 1,
        ...createTrainingPlanDto,
        workouts: [
          { id: 1, name: 'Workout 1', description: 'Description 1' },
          { id: 2, name: 'Workout 2', description: 'Description 2' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });

      const result = await service.createTrainingPlan(createTrainingPlanDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createTrainingPlanDto.name);
      expect(result.workouts).toHaveLength(2);
    });

    it('should throw if training plan name already exists', async () => {
      prismaServiceMock.trainingPlan.findFirst.mockResolvedValue({ id: 1, name: 'Test Training Plan' });

      await expect(service.createTrainingPlan(createTrainingPlanDto))
        .rejects
        .toThrow(RpcException);
    });

    it('should throw if workouts do not exist', async () => {
      prismaServiceMock.trainingPlan.findFirst.mockResolvedValue(null);
      prismaServiceMock.workout.findMany.mockResolvedValue([{ id: 1 }]); // Only one workout exists

      await expect(service.createTrainingPlan(createTrainingPlanDto))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('findAllTrainingPlan', () => {
    const paginationDto = { page: 1, limit: 10 };

    it('should return paginated training plans', async () => {
      const trainingPlans = [
        { id: 1, name: 'Plan 1', workouts: [] },
        { id: 2, name: 'Plan 2', workouts: [] },
      ];

      prismaServiceMock.trainingPlan.count.mockResolvedValue(2);
      prismaServiceMock.trainingPlan.findMany.mockResolvedValue(trainingPlans);

      const result = await service.findAllTrainingPlan(paginationDto);

      expect(result.data).toHaveLength(2);
      expect(result.meta.totalTrainingPlans).toBe(2);
      expect(result.meta.page).toBe(paginationDto.page);
    });
  });

  describe('findTrainingPlanById', () => {
    it('should return a training plan if found', async () => {
      const trainingPlan = {
        id: 1,
        name: 'Test Plan',
        workouts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };

      prismaServiceMock.trainingPlan.findUnique.mockResolvedValue(trainingPlan);

      const result = await service.findTrainingPlanById(1);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Test Plan');
    });

    it('should throw if training plan not found', async () => {
      prismaServiceMock.trainingPlan.findUnique.mockResolvedValue(null);

      await expect(service.findTrainingPlanById(999))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('findTrainingPlanByIds', () => {
    it('should return training plans for valid IDs', async () => {
      const trainingPlans = [
        { id: 1, name: 'Plan 1', workouts: [] },
        { id: 2, name: 'Plan 2', workouts: [] },
      ];

      prismaServiceMock.trainingPlan.findMany.mockResolvedValue(trainingPlans);

      const result = await service.findTrainingPlanByIds([1, 2]);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 1);
      expect(result[1]).toHaveProperty('id', 2);
    });

    it('should throw if any training plan not found', async () => {
      prismaServiceMock.trainingPlan.findMany.mockResolvedValue([{ id: 1 }]);

      await expect(service.findTrainingPlanByIds([1, 2]))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('rateTrainingPlan', () => {
    const rateDto: RateDto = {
      targetId: 1,
      score: 4.5,
      totalRatings: 10,
    };

    it('should rate training plan successfully', async () => {
      prismaServiceMock.trainingPlan.findUnique.mockResolvedValue({
        id: 1,
        score: 4.0,
        totalRatings: 9,
      });

      prismaServiceMock.trainingPlan.update.mockResolvedValue({
        id: 1,
        name: 'Test Plan',
        score: rateDto.score,
        totalRatings: rateDto.totalRatings,
        updatedAt: new Date(),
      });

      const result = await service.rateTrainingPlan(rateDto);

      expect(result.score).toBe(rateDto.score);
      expect(result.totalRatings).toBe(rateDto.totalRatings);
    });

    it('should throw if score is invalid', async () => {
      const invalidRateDto = { ...rateDto, score: 6 };

      await expect(service.rateTrainingPlan(invalidRateDto))
        .rejects
        .toThrow(RpcException);
    });

    it('should throw if total ratings is negative', async () => {
      const invalidRateDto = { ...rateDto, totalRatings: -1 };

      await expect(service.rateTrainingPlan(invalidRateDto))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('updateTrainingPlan', () => {
    const updateTrainingPlanDto: UpdateTrainingPlanDto = {
      name: 'Updated Plan',
      workoutsIds: [1],
    };

    it('should update training plan successfully', async () => {
      // Mock existing plan
      prismaServiceMock.trainingPlan.findUnique.mockResolvedValue({
        id: 1,
        name: 'Old Name',
        isDeleted: false,
      });

      // Mock validations
      prismaServiceMock.trainingPlan.findFirst.mockResolvedValue(null);
      prismaServiceMock.workout.findMany.mockResolvedValue([{ id: 1 }]);

      // Mock update
      prismaServiceMock.trainingPlan.update.mockResolvedValue({
        id: 1,
        ...updateTrainingPlanDto,
        workouts: [{ id: 1, name: 'Workout 1', description: 'Description 1' }],
        updatedAt: new Date(),
        isDeleted: false,
      });

      const result = await service.updateTrainingPlan(1, updateTrainingPlanDto);

      expect(result).toHaveProperty('name', updateTrainingPlanDto.name);
      expect(result.workouts).toHaveLength(1);
    });
  });

  describe('removeTrainingPlan', () => {
    it('should soft delete training plan successfully', async () => {
      // Mock existing plan
      prismaServiceMock.trainingPlan.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Plan',
        isDeleted: false,
      });

      // Mock successful deletion
      prismaServiceMock.trainingPlan.update.mockResolvedValue({
        id: 1,
        isDeleted: true,
      });

      const result = await service.removeTrainingPlan(1);

      expect(result).toHaveProperty('message', 'Training plan deleted successfully');
      expect(result).toHaveProperty('id', 1);
    });
  });

  // Integration test
  describe('Integration Tests', () => {
    it('should handle complete training plan lifecycle', async () => {
      // 1. Create training plan
      const createDto: CreateTrainingPlanDto = {
        name: 'Lifecycle Test Plan',
        level: Difficulty.BASIC,
        description: 'Test Description',
        startDate: new Date(),
        workoutsIds: [1],
      };

      prismaServiceMock.trainingPlan.findFirst.mockResolvedValue(null);
      prismaServiceMock.workout.findMany.mockResolvedValue([{ id: 1 }]);
      prismaServiceMock.trainingPlan.create.mockResolvedValue({
        id: 1,
        ...createDto,
        workouts: [{ id: 1, name: 'Workout 1', description: 'Description 1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });

      const created = await service.createTrainingPlan(createDto);
      expect(created).toHaveProperty('id');

      // 2. Update training plan
      const updateDto: UpdateTrainingPlanDto = {
        name: 'Updated Lifecycle Plan',
        workoutsIds: [1],
      };

      prismaServiceMock.trainingPlan.update.mockResolvedValue({
        ...created,
        ...updateDto,
      });

      const updated = await service.updateTrainingPlan(created.id, updateDto);
      expect(updated.name).toBe(updateDto.name);

      // 3. Rate training plan
      const rateDto: RateDto = {
        targetId: created.id,
        score: 4.5,
        totalRatings: 1,
      };

      prismaServiceMock.trainingPlan.findUnique.mockResolvedValue(updated);
      prismaServiceMock.trainingPlan.update.mockResolvedValue({
        ...updated,
        score: rateDto.score,
        totalRatings: rateDto.totalRatings,
      });

      const rated = await service.rateTrainingPlan(rateDto);
      expect(rated.score).toBe(rateDto.score);

      // 4. Remove training plan
      prismaServiceMock.trainingPlan.update.mockResolvedValue({
        ...rated,
        isDeleted: true,
      });

      const removed = await service.removeTrainingPlan(created.id);
      expect(removed.message).toContain('successfully');
    });
  });
});