import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';

export function ensureCategoryCanBeModified(
  category: Category | null,
  userId: string,
  categoryId: string,
  action: 'modify' | 'delete' = 'modify',
): asserts category is Category {
  if (!category) {
    throw new NotFoundException(`Category with ID "${categoryId}" not found`);
  }

  if (category.isDefault || category.userId !== userId) {
    throw new ForbiddenException(
      action === 'delete'
        ? 'You cannot delete default categories or categories belonging to another user'
        : 'You cannot modify default categories or categories belonging to another user',
    );
  }
}
