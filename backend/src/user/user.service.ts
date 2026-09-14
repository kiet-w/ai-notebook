import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { User } from '@prisma/client';
import { UserRepository } from './repository/user.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { hashPassword } from './utils/password.util';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(): Promise<ResponseUserDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((u) => this.toResponse(u));
  }

  async findOne(id: string): Promise<ResponseUserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<ResponseUserDto> {
    await this.findOne(id);
    const data: UpdateUserDto = { ...dto };
    if (dto.password) {
      data.password = await hashPassword(dto.password);
    }
    const user = await this.userRepository.update(id, data);
    return this.toResponse(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.userRepository.delete(id);
  }

  private toResponse(user: User): ResponseUserDto {
    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
