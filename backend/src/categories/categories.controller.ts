import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Category } from '@prisma/client';
import type { Request } from 'express';

interface AuthRequest extends Request {
  user: { id: string; role: string };
}

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Req() req: AuthRequest): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesService.findAll(req.user.id);
    return categories.map((c) => this.toResponseDto(c));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: AuthRequest,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.create(
      req.user.id,
      createCategoryDto,
    );
    return this.toResponseDto(category);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: AuthRequest,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.update(
      req.user.id,
      id,
      updateCategoryDto,
    );
    return this.toResponseDto(category);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<{ message: string; id: string }> {
    const deleted = await this.categoriesService.delete(req.user.id, id);
    return {
      message: 'Category deleted successfully',
      id: deleted.id,
    };
  }

  private toResponseDto(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      key: category.key,
      emoji: category.emoji,
      isDefault: category.isDefault,
      userId: category.userId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
