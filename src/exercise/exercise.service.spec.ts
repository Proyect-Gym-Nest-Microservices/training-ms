import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseService } from './exercise.service';
import { RpcException } from '@nestjs/microservices';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { RateDto } from '../common/dto/rate.dto';
import { Category } from '../common/enums/categories.enum';
import { Difficulty } from '../common/enums/difficulties.enum';

// Mock Prisma Client
const prismaServiceMock = {
  exercise: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(), 
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  muscleGroup: {
    findMany: jest.fn(),
  },
  equipment: {
    findMany: jest.fn(),
  },
  exerciseInWorkout: {
    findMany: jest.fn(),
  },
  $connect: jest.fn(),
  $transaction: jest.fn((callback) => callback(prismaServiceMock)),
};

describe('ExerciseService', () => {
  let service: ExerciseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExerciseService],
    }).compile();

    service = module.get<ExerciseService>(ExerciseService);
    // Replace Prisma instance with mock
    Object.assign(service, prismaServiceMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExercise', () => {
    const createExerciseDto: CreateExerciseDto = {
      name: 'Test Exercise',
      description: 'Test Description',
      mediaUrl: 'http://test.com/image.jpg',
      level: Difficulty.BASIC,
      category: Category.STRENGTH,
      muscleGroupsIds: [1],
      equipmentIds: [1],
      recommendation: 'Test recommendation'
    };

    it('should create an exercise successfully', async () => {
      // Mock validations
      prismaServiceMock.exercise.findFirst.mockResolvedValue(null);
      prismaServiceMock.muscleGroup.findMany.mockResolvedValue([{ id: 1 }]);
      prismaServiceMock.equipment.findMany.mockResolvedValue([{ id: 1 }]);

      // Mock creation
      prismaServiceMock.exercise.create.mockResolvedValue({
        id: 1,
        ...createExerciseDto,
        muscleGroups: [{ id: 1, name: 'Muscle Group 1', description: 'Description' }],
        equipments: [{ id: 1, name: 'Equipment 1', description: 'Description' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });

      const result = await service.createExercise(createExerciseDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createExerciseDto.name);
      expect(result.muscleGroups).toHaveLength(1);
      expect(result.equipments).toHaveLength(1);
    });

    it('should throw if exercise name already exists', async () => {
      prismaServiceMock.exercise.findFirst.mockResolvedValue({ id: 1, name: 'Test Exercise' });

      await expect(service.createExercise(createExerciseDto))
        .rejects
        .toThrow(RpcException);
    });

    it('should throw if muscle group does not exist', async () => {
      prismaServiceMock.exercise.findFirst.mockResolvedValue(null);
      prismaServiceMock.muscleGroup.findMany.mockResolvedValue([]);

      await expect(service.createExercise(createExerciseDto))
        .rejects
        .toThrow(RpcException);
    });

    it('should throw if equipment does not exist', async () => {
      prismaServiceMock.exercise.findFirst.mockResolvedValue(null);
      prismaServiceMock.muscleGroup.findMany.mockResolvedValue([{ id: 1 }]);
      prismaServiceMock.equipment.findMany.mockResolvedValue([]);

      await expect(service.createExercise(createExerciseDto))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('findAllExercises', () => {
    const paginationDto = { page: 1, limit: 10 };

    it('should return paginated exercises', async () => {
      const exercises = [
        { 
          id: 1, 
          name: 'Exercise 1',
          muscleGroups: [{ id: 1, name: 'Muscle 1' }],
          equipments: [{ id: 1, name: 'Equipment 1' }]
        },
        { 
          id: 2, 
          name: 'Exercise 2',
          muscleGroups: [{ id: 2, name: 'Muscle 2' }],
          equipments: [{ id: 2, name: 'Equipment 2' }]
        }
      ];

      prismaServiceMock.exercise.count.mockResolvedValue(2);
      prismaServiceMock.exercise.findMany.mockResolvedValue(exercises);

      const result = await service.findAllExercises(paginationDto);

      expect(result.data).toHaveLength(2);
      expect(result.meta.totalExercises).toBe(2);
      expect(result.meta.page).toBe(paginationDto.page);
    });
  });

  describe('findExerciseById', () => {
    it('should return an exercise if found', async () => {
      const exercise = {
        id: 1,
        name: 'Test Exercise',
        muscleGroups: [{ id: 1, name: 'Muscle 1' }],
        equipments: [{ id: 1, name: 'Equipment 1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      };

      prismaServiceMock.exercise.findUnique.mockResolvedValue(exercise);

      const result = await service.findExerciseById(1);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Test Exercise');
      expect(result.muscleGroups).toHaveLength(1);
      expect(result.equipments).toHaveLength(1);
    });

    it('should throw if exercise not found', async () => {
      prismaServiceMock.exercise.findUnique.mockResolvedValue(null);

      await expect(service.findExerciseById(999))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('rateExercise', () => {
    const rateDto: RateDto = {
      targetId: 1,
      score: 4.5,
      totalRatings: 10
    };

    it('should rate exercise successfully', async () => {
      prismaServiceMock.exercise.findUnique.mockResolvedValue({
        id: 1,
        score: 4.0,
        totalRatings: 9
      });

      prismaServiceMock.exercise.update.mockResolvedValue({
        id: 1,
        name: 'Test Exercise',
        score: rateDto.score,
        totalRatings: rateDto.totalRatings,
        updatedAt: new Date()
      });

      const result = await service.rateExercise(rateDto);

      expect(result.score).toBe(rateDto.score);
      expect(result.totalRatings).toBe(rateDto.totalRatings);
    });

    it('should throw if score is invalid', async () => {
      const invalidRateDto = { ...rateDto, score: 6 };

      await expect(service.rateExercise(invalidRateDto))
        .rejects
        .toThrow(RpcException);
    });

    it('should throw if total ratings is negative', async () => {
      const invalidRateDto = { ...rateDto, totalRatings: -1 };

      await expect(service.rateExercise(invalidRateDto))
        .rejects
        .toThrow(RpcException);
    });
  });

  describe('updateExercise', () => {
    const updateExerciseDto: UpdateExerciseDto = {
      name: 'Updated Exercise',
      muscleGroupsIds: [1],
      equipmentIds: [1]
    };

    it('should update exercise successfully', async () => {
      // Mock existing exercise
      prismaServiceMock.exercise.findUnique.mockResolvedValue({
        id: 1,
        name: 'Old Name',
        isDeleted: false,
        muscleGroups: [],
        equipments: []
      });

      // Mock validations
      prismaServiceMock.exercise.findFirst.mockResolvedValue(null);
      prismaServiceMock.muscleGroup.findMany.mockResolvedValue([{ id: 1 }]);
      prismaServiceMock.equipment.findMany.mockResolvedValue([{ id: 1 }]);

      // Mock update
      prismaServiceMock.exercise.update.mockResolvedValue({
        id: 1,
        ...updateExerciseDto,
        muscleGroups: [{ id: 1, name: 'Muscle Group 1' }],
        equipments: [{ id: 1, name: 'Equipment 1' }],
        updatedAt: new Date(),
        isDeleted: false
      });

      const result = await service.updateExercise(1, updateExerciseDto);

      expect(result).toHaveProperty('name', updateExerciseDto.name);
      expect(result.muscleGroups).toHaveLength(1);
      expect(result.equipments).toHaveLength(1);
    });
  });

  describe('removeExercise', () => {
    it('should soft delete exercise successfully', async () => {
      // Mock existing exercise
      prismaServiceMock.exercise.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Exercise',
        isDeleted: false
      });

      // Mock no dependencies
      prismaServiceMock.exerciseInWorkout.findMany.mockResolvedValue([]);

      // Mock successful deletion
      prismaServiceMock.exercise.update.mockResolvedValue({
        id: 1,
        isDeleted: true,
        name: 'Test Exercise_deleted_1'
      });

      const result = await service.removeExercise(1);

      expect(result).toHaveProperty('message', 'Exercise plan deleted successfully');
      expect(result).toHaveProperty('id', 1);
    });

    it('should throw if exercise has workout dependencies', async () => {
      prismaServiceMock.exercise.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Exercise',
        isDeleted: false
      });

      prismaServiceMock.exerciseInWorkout.findMany.mockResolvedValue([{ id: 1 }]);

      await expect(service.removeExercise(1))
        .rejects
        .toThrow(RpcException);
    });
  });

  // Integration test
  describe('Integration Tests', () => {
    it('should handle complete exercise lifecycle', async () => {
      // 1. Create exercise
      const createDto: CreateExerciseDto = {
        name: 'Lifecycle Test Exercise',
        description: 'Test Description',
        mediaUrl: 'http://test.com/image.jpg',
        level: Difficulty.BASIC,
        category: Category.STRENGTH,
        muscleGroupsIds: [1],
        equipmentIds: [1],
        recommendation: 'Test recommendation'
      };

      prismaServiceMock.exercise.findFirst.mockResolvedValue(null);
      prismaServiceMock.muscleGroup.findMany.mockResolvedValue([{ id: 1 }]);
      prismaServiceMock.equipment.findMany.mockResolvedValue([{ id: 1 }]);
      prismaServiceMock.exercise.create.mockResolvedValue({
        id: 1,
        ...createDto,
        muscleGroups: [{ id: 1, name: 'Muscle Group 1' }],
        equipments: [{ id: 1, name: 'Equipment 1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      });

      const created = await service.createExercise(createDto);
      expect(created).toHaveProperty('id');

      // 2. Update exercise
      const updateDto: UpdateExerciseDto = {
        name: 'Updated Lifecycle Exercise',
        muscleGroupsIds: [1],
        equipmentIds: [1]
      };

      prismaServiceMock.exercise.update.mockResolvedValue({
        ...created,
        ...updateDto
      });

      const updated = await service.updateExercise(created.id, updateDto);
      expect(updated.name).toBe(updateDto.name);

      // 3. Rate exercise
      const rateDto: RateDto = {
        targetId: created.id,
        score: 4.5,
        totalRatings: 1,
      };

      prismaServiceMock.exercise.findUnique.mockResolvedValue(updated);
      prismaServiceMock.exercise.update.mockResolvedValue({
        ...updated,
        score: rateDto.score,
        totalRatings: rateDto.totalRatings
      });

      const rated = await service.rateExercise(rateDto);
      expect(rated.score).toBe(rateDto.score);

      // 4. Remove exercise
      prismaServiceMock.exerciseInWorkout.findMany.mockResolvedValue([]);
      prismaServiceMock.exercise.update.mockResolvedValue({
        ...rated,
        isDeleted: true,
        name: `${rated.name}_deleted_${rated.id}`
      });

      const removed = await service.removeExercise(created.id);
      expect(removed.message).toContain('successfully');
    });
  });
});