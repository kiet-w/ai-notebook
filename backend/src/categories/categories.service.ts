import {
  Injectable,
  OnModuleInit,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CategoriesRepository } from './repository/categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from '@prisma/client';
import { DEFAULT_CATEGORIES } from './constants/default-categories';
import { formatCategoryEmoji, slugifyCategoryKey } from './utils/category.util';
import { ensureCategoryCanBeModified } from './policies/category.policy';

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly repository: CategoriesRepository) {}

  async onModuleInit() {
    try {
      await this.ensureDefaultCategories();
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to ensure default categories during init (DB might be migrating): ${(err as Error).message}`,
      );
    }
  }

  async ensureDefaultCategories(): Promise<void> {
    for (const def of DEFAULT_CATEGORIES) {
      const existing = await this.repository.findByNameForUser(def.name);
      if (!existing) {
        await this.repository.create({
          name: def.name,
          key: def.key,
          emoji: def.emoji,
          isDefault: true,
        });
      }
    }
  }

  async findAll(userId: string): Promise<Category[]> {
    return this.repository.findAvailableForUser(userId);
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findById(id);
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const trimmedName = dto.name.trim();
    const existing = await this.repository.findByNameForUser(
      trimmedName,
      userId,
    );
    if (existing) {
      throw new ConflictException(`Category "${trimmedName}" already exists`);
    }

    return this.repository.create({
      name: trimmedName,
      key: slugifyCategoryKey(trimmedName),
      emoji: formatCategoryEmoji(dto.emoji),
      isDefault: false,
      user: { connect: { id: userId } },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.repository.findById(id);
    ensureCategoryCanBeModified(category, userId, id, 'modify');

    const dataToUpdate: { name?: string; emoji?: string; key?: string } = {};

    if (dto.name) {
      const trimmedName = dto.name.trim();
      if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
        const existing = await this.repository.findByNameForUser(
          trimmedName,
          userId,
        );
        if (existing && existing.id !== id) {
          throw new ConflictException(
            `Category "${trimmedName}" already exists`,
          );
        }
      }
      dataToUpdate.name = trimmedName;
      dataToUpdate.key = slugifyCategoryKey(trimmedName);
    }

    if (dto.emoji !== undefined) {
      dataToUpdate.emoji = formatCategoryEmoji(dto.emoji);
    }

    return this.repository.update(id, dataToUpdate);
  }

  async delete(userId: string, id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    ensureCategoryCanBeModified(category, userId, id, 'delete');

    return this.repository.delete(id);
  }

  async resolveCategoryForNote(
    userId: string,
    categoryNameOrKey?: string,
    categoryId?: string,
  ): Promise<Category | null> {
    if (categoryId) {
      const found = await this.repository.findById(categoryId);
      if (found) return found;
    }

    if (categoryNameOrKey) {
      const trimmed = categoryNameOrKey.trim();
      const byName = await this.repository.findByNameForUser(trimmed, userId);
      if (byName) return byName;

      const byKey = await this.repository.findByKey(trimmed);
      if (byKey) return byKey;

      // Auto-create custom category for user if not exists
      try {
        return await this.repository.create({
          name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
          key: slugifyCategoryKey(trimmed),
          emoji: '📁',
          isDefault: false,
          user: { connect: { id: userId } },
        });
      } catch {
        // In case of race condition, re-query
        return this.repository.findByNameForUser(trimmed, userId);
      }
    }

    // Default to 'Other'
    return (
      (await this.repository.findByNameForUser('Other')) ||
      (await this.repository.findByKey('other'))
    );
  }
}
