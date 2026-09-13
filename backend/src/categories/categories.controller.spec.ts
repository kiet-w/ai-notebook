/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { JwtService } from '@nestjs/jwt';
import { Category } from '@prisma/client';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Tech',
    key: 'tech',
    emoji: '💻',
    isDefault: true,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthReq = {
    user: { id: 'user-1', role: 'user' },
  } as unknown as Parameters<typeof controller.create>[1];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockCategory]),
            create: jest.fn().mockResolvedValue(mockCategory),
            update: jest.fn().mockResolvedValue(mockCategory),
            delete: jest.fn().mockResolvedValue(mockCategory),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of category responses', async () => {
      const result = await controller.findAll(mockAuthReq);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tech');
      expect(jest.mocked(service.findAll)).toHaveBeenCalledWith('user-1');
    });
  });

  describe('create', () => {
    it('should create and return category response', async () => {
      const result = await controller.create(
        { name: 'Tech', emoji: '💻' },
        mockAuthReq,
      );
      expect(result.name).toBe('Tech');
      expect(jest.mocked(service.create)).toHaveBeenCalledWith('user-1', {
        name: 'Tech',
        emoji: '💻',
      });
    });
  });

  describe('update', () => {
    it('should update and return category response', async () => {
      const result = await controller.update(
        'cat-1',
        { name: 'Updated Tech' },
        mockAuthReq,
      );
      expect(result.name).toBe('Tech');
      expect(jest.mocked(service.update)).toHaveBeenCalledWith(
        'user-1',
        'cat-1',
        {
          name: 'Updated Tech',
        },
      );
    });
  });

  describe('delete', () => {
    it('should delete and return success message', async () => {
      const result = await controller.delete('cat-1', mockAuthReq);
      expect(result).toEqual({
        message: 'Category deleted successfully',
        id: 'cat-1',
      });
      expect(jest.mocked(service.delete)).toHaveBeenCalledWith(
        'user-1',
        'cat-1',
      );
    });
  });
});
