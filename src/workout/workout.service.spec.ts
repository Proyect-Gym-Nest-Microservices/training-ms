import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutService } from './workout.service';
import { RpcException } from '@nestjs/microservices';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { RateDto } from '../common/dto/rate.dto';
import { Category } from '../common/enums/categories.enum';
import { Difficulty } from '../common/enums/difficulties.enum';

// Mock Prisma Client
const prismaServiceMock = {
    workout: {
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
    exerciseInWorkout: {
        findUnique: jest.fn(),
        updateMany: jest.fn(), // Añadimos esta función
        deleteMany: jest.fn(), // Podría ser necesaria también
    },
    trainingPlan: {
        findMany: jest.fn(),
    },
    $connect: jest.fn(),
    $transaction: jest.fn((callback) => callback(prismaServiceMock)),
};

describe('WorkoutService', () => {
    let service: WorkoutService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [WorkoutService],
        }).compile();

        service = module.get<WorkoutService>(WorkoutService);
        // Replace Prisma instance with mock
        Object.assign(service, prismaServiceMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createWorkout', () => {
        const createWorkoutDto: CreateWorkoutDto = {
            name: 'Test Workout',
            description: 'Test Description',
            level: Difficulty.BASIC,
            category: Category.STRENGTH,
            duration: 10,
            frequency: 2,
            trainingType: 'Test trainig Type',
            exercisesInWorkout: [
                {
                    exerciseId: 1,
                    sets: 3,
                    reps: 12,
                    weight: 50,
                    restTime: 60,
                    order: 1
                }
            ]
        };

        it('should create a workout successfully', async () => {
            // Mock validations
            prismaServiceMock.workout.findFirst.mockResolvedValue(null);
            prismaServiceMock.exercise.findMany.mockResolvedValue([{ id: 1 }]);

            // Mock creation
            prismaServiceMock.workout.create.mockResolvedValue({
                id: 1,
                ...createWorkoutDto,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                exercisesInWorkout: [{
                    id: 1,
                    exerciseId: 1,
                    workoutId: 1,
                    sets: 3,
                    reps: 12,
                    weight: 50,
                    restTime: 60,
                    order: 1
                }]
            });

            const result = await service.createWorkout(createWorkoutDto);

            expect(result).toHaveProperty('id');
            expect(result.name).toBe(createWorkoutDto.name);
            expect(result.exercisesInWorkout).toHaveLength(1);
        });

        it('should throw if workout name already exists', async () => {
            prismaServiceMock.workout.findFirst.mockResolvedValue({ id: 1, name: 'Test Workout' });

            await expect(service.createWorkout(createWorkoutDto))
                .rejects
                .toThrow(RpcException);
        });
    });

    describe('findAllWorkouts', () => {
        const paginationDto = { page: 1, limit: 10 };

        it('should return paginated workouts', async () => {
            const workouts = [
                { id: 1, name: 'Workout 1', exercisesInWorkout: [] },
                { id: 2, name: 'Workout 2', exercisesInWorkout: [] }
            ];

            prismaServiceMock.workout.count.mockResolvedValue(2);
            prismaServiceMock.workout.findMany.mockResolvedValue(workouts);

            const result = await service.findAllWorkouts(paginationDto);

            expect(result.data).toHaveLength(2);
            expect(result.meta.totalWorkouts).toBe(2);
            expect(result.meta.page).toBe(paginationDto.page);
        });
    });

    describe('findWorkoutById', () => {
        it('should return a workout if found', async () => {
            const workout = {
                id: 1,
                name: 'Test Workout',
                exercisesInWorkout: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false
            };

            prismaServiceMock.workout.findUnique.mockResolvedValue(workout);

            const result = await service.findWorkoutById(1);

            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('name', 'Test Workout');
        });

        it('should throw if workout not found', async () => {
            prismaServiceMock.workout.findUnique.mockResolvedValue(null);

            await expect(service.findWorkoutById(999))
                .rejects
                .toThrow(RpcException);
        });
    });

    describe('updateWorkout', () => {
        const updateWorkoutDto: UpdateWorkoutDto = {
            name: 'Updated Workout',
            exercisesInWorkout: [
                {
                    exerciseId: 1,
                    sets: 4,
                    reps: 15,
                    weight: 60,
                    restTime: 45,
                    order: 1
                }
            ]
        };

        it('should update workout successfully', async () => {
            // Mock existing workout
            prismaServiceMock.workout.findUnique.mockResolvedValue({
                id: 1,
                name: 'Old Name',
                isDeleted: false
            });

            // Mock validations
            prismaServiceMock.workout.findFirst.mockResolvedValue(null);
            prismaServiceMock.exercise.findMany.mockResolvedValue([{ id: 1 }]);

            // Mock update
            prismaServiceMock.workout.update.mockResolvedValue({
                id: 1,
                ...updateWorkoutDto,
                updatedAt: new Date(),
                isDeleted: false
            });

            const result = await service.updateWorkout(1, updateWorkoutDto);

            expect(result).toHaveProperty('name', updateWorkoutDto.name);
            expect(result.exercisesInWorkout).toHaveLength(1);
        });
    });

    describe('removeWorkout', () => {
        it('should soft delete workout successfully', async () => {
            // Mock existing workout
            prismaServiceMock.workout.findUnique.mockResolvedValue({
                id: 1,
                name: 'Test Workout',
                isDeleted: false
            });

            // Mock no dependencies
            prismaServiceMock.trainingPlan.findMany.mockResolvedValue([]);

            // Mock successful deletion
            prismaServiceMock.workout.update.mockResolvedValue({
                id: 1,
                isDeleted: true
            });

            const result = await service.removeWorkout(1);

            expect(result).toHaveProperty('message', 'Workout deleted successfully');
            expect(result).toHaveProperty('id', 1);
        });

        it('should throw if workout has dependencies', async () => {
            prismaServiceMock.workout.findUnique.mockResolvedValue({
                id: 1,
                name: 'Test Workout',
                isDeleted: false
            });

            prismaServiceMock.trainingPlan.findMany.mockResolvedValue([{ id: 1 }]);

            await expect(service.removeWorkout(1))
                .rejects
                .toThrow(RpcException);
        });
    });

    describe('rateWorkout', () => {
        const rateDto: RateDto = {
            targetId: 1,
            score: 4.5,
            totalRatings: 10
        };

        it('should rate workout successfully', async () => {
            prismaServiceMock.workout.findUnique.mockResolvedValue({
                id: 1,
                score: 4.0,
                totalRatings: 9
            });

            prismaServiceMock.workout.update.mockResolvedValue({
                id: 1,
                name: 'Test Workout',
                score: rateDto.score,
                totalRatings: rateDto.totalRatings,
                updatedAt: new Date()
            });

            const result = await service.rateWorkout(rateDto);

            expect(result.score).toBe(rateDto.score);
            expect(result.totalRatings).toBe(rateDto.totalRatings);
        });

        it('should throw if score is invalid', async () => {
            const invalidRateDto = { ...rateDto, score: 6 };

            await expect(service.rateWorkout(invalidRateDto))
                .rejects
                .toThrow(RpcException);
        });
    });

    // Integration test
    describe('Integration Tests', () => {
        it('should handle complete workout lifecycle', async () => {
            // 1. Create workout
            const createDto: CreateWorkoutDto = {
                name: 'Lifecycle Test Workout',
                description: 'Test Description',
                level: Difficulty.BASIC,
                category: Category.STRENGTH,
                frequency: 2,
                duration: 10,
                trainingType:'Test',
                exercisesInWorkout: [
                    {
                        exerciseId: 1,
                        sets: 3,
                        reps: 12,
                        weight: 50,
                        restTime: 60,
                        order: 1
                    }
                ]
            };

            prismaServiceMock.workout.findFirst.mockResolvedValue(null);
            prismaServiceMock.exercise.findMany.mockResolvedValue([{ id: 1 }]);
            prismaServiceMock.workout.create.mockResolvedValue({
                id: 1,
                ...createDto,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false
            });

            const created = await service.createWorkout(createDto);
            expect(created).toHaveProperty('id');

            // 2. Update workout
            const updateDto: UpdateWorkoutDto = {
                name: 'Updated Lifecycle Workout',
                exercisesInWorkout: [
                    {
                        exerciseId: 1,
                        sets: 4,
                        reps: 15,
                        weight: 60,
                        restTime: 45,
                        order: 1
                    }
                ]
            };

            prismaServiceMock.workout.findUnique.mockResolvedValue(created);
            prismaServiceMock.workout.update.mockResolvedValue({
                ...created,
                ...updateDto
            });

            const updated = await service.updateWorkout(created.id, updateDto);
            expect(updated.name).toBe(updateDto.name);

            // 3. Rate workout
            const rateDto: RateDto = {
                targetId: created.id,
                score: 4.5,
                totalRatings: 1
            };

            prismaServiceMock.workout.findUnique.mockResolvedValue(updated);
            prismaServiceMock.workout.update.mockResolvedValue({
                ...updated,
                score: rateDto.score,
                totalRatings: rateDto.totalRatings
            });

            const rated = await service.rateWorkout(rateDto);
            expect(rated.score).toBe(rateDto.score);

            // 4. Remove workout
            prismaServiceMock.trainingPlan.findMany.mockResolvedValue([]);
            prismaServiceMock.workout.update.mockResolvedValue({
                ...rated,
                isDeleted: true
            });

            const removed = await service.removeWorkout(created.id);
            expect(removed.message).toContain('successfully');
        });
    });
});