/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../categories.service';
import { CategoriesRepository } from '../repository/categories.repository';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '@prisma/client';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: CategoriesRepository;

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

  const mockUserCategory: Category = {
    id: 'cat-custom',
    name: 'Design',
    key: 'design',
    emoji: '🎨',
    isDefault: false,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesRepository,
          useValue: {
            findAvailableForUser: jest.fn(),
            findByNameForUser: jest.fn(),
            findByKey: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            countDefaultCategories: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<CategoriesRepository>(CategoriesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return available categories for user', async () => {
      jest
        .spyOn(repository, 'findAvailableForUser')
        .mockResolvedValue([mockCategory, mockUserCategory]);

      const result = await service.findAll('user-1');
      expect(result).toEqual([mockCategory, mockUserCategory]);
      expect(jest.mocked(repository.findAvailableForUser)).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });

  describe('create', () => {
    it('should throw ConflictException if category name already exists', async () => {
      jest
        .spyOn(repository, 'findByNameForUser')
        .mockResolvedValue(mockCategory);

      await expect(
        service.create('user-1', { name: 'Tech', emoji: '💻' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new custom category successfully', async () => {
      jest.spyOn(repository, 'findByNameForUser').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(mockUserCategory);

      const result = await service.create('user-1', {
        name: 'Design',
        emoji: '🎨',
      });
      expect(result).toEqual(mockUserCategory);
      expect(jest.mocked(repository.create)).toHaveBeenCalledWith({
        name: 'Design',
        key: 'design',
        emoji: '🎨',
        isDefault: false,
        user: { connect: { id: 'user-1' } },
      });
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(
        service.update('user-1', 'non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating default category', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockCategory);

      await expect(
        service.update('user-1', 'cat-1', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when updating category of another user', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue({
        ...mockUserCategory,
        userId: 'user-2',
      });

      await expect(
        service.update('user-1', 'cat-custom', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update custom category successfully', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUserCategory);
      jest.spyOn(repository, 'findByNameForUser').mockResolvedValue(null);
      jest.spyOn(repository, 'update').mockResolvedValue({
        ...mockUserCategory,
        name: 'Updated Design',
      });

      const result = await service.update('user-1', 'cat-custom', {
        name: 'Updated Design',
      });
      expect(result.name).toBe('Updated Design');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.delete('user-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when deleting default category', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockCategory);

      await expect(service.delete('user-1', 'cat-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete custom category successfully', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUserCategory);
      jest.spyOn(repository, 'delete').mockResolvedValue(mockUserCategory);

      const result = await service.delete('user-1', 'cat-custom');
      expect(result).toEqual(mockUserCategory);
    });
  });

  describe('resolveCategoryForNote', () => {
    it('should resolve by categoryId if found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockCategory);

      const result = await service.resolveCategoryForNote(
        'user-1',
        undefined,
        'cat-1',
      );
      expect(result).toEqual(mockCategory);
    });

    it('should resolve by name if found', async () => {
      jest
        .spyOn(repository, 'findByNameForUser')
        .mockResolvedValue(mockCategory);

      const result = await service.resolveCategoryForNote('user-1', 'Tech');
      expect(result).toEqual(mockCategory);
    });

    it('should auto-create custom category if name does not exist', async () => {
      jest.spyOn(repository, 'findByNameForUser').mockResolvedValue(null);
      jest.spyOn(repository, 'findByKey').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(mockUserCategory);

      const result = await service.resolveCategoryForNote('user-1', 'Design');
      expect(result).toEqual(mockUserCategory);
      expect(jest.mocked(repository.create)).toHaveBeenCalled();
    });

    it('should fallback to Other if no category specified', async () => {
      const mockOtherCategory: Category = {
        ...mockCategory,
        id: 'cat-other',
        name: 'Other',
        key: 'other',
      };
      jest
        .spyOn(repository, 'findByNameForUser')
        .mockResolvedValue(mockOtherCategory);

      const result = await service.resolveCategoryForNote('user-1');
      expect(result).toEqual(mockOtherCategory);
    });
  });
});
