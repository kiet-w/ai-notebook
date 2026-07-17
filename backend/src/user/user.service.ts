import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { UserRepository } from './repository/user.repository';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthResponseDto } from './dto/response-token.dto';
import { CheckEmailException } from '../common/exceptions/auth/check-email.exception';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(): Promise<ResponseUserDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((u) => this.toResponse(u));
  }
  async register(dto: CreateUserDto, ip: string, userAgent: string): Promise<AuthResponseDto> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findByEmail(dto.email),
      this.userRepository.findByUsername(dto.user),
    ]);

    if (existingEmail) throw new CheckEmailException();
    if (existingUsername)
      throw new ConflictException(`Username "${dto.user}" is already taken`);

    const passwordHash = await argon2.hash(dto.password);
    const newUser = await this.userRepository.create({
      user: dto.user,
      email: dto.email,
      password: passwordHash,
    });

    return this.issueToken(newUser, ip, userAgent, randomUUID());
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
      data.password = await argon2.hash(dto.password);
    }
    const user = await this.userRepository.update(id, data);
    return this.toResponse(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.userRepository.delete(id);
  }

  private async issueToken(
    user: User,
    ip: string,
    userAgent: string,
    family: string,
  ): Promise<AuthResponseDto> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, role: user.role },
      { expiresIn: '15m' },
    );
    const refreshToken = randomBytes(64).toString('hex');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const saved = await this.userRepository.createRefreshToken({
      tokenHash,
      family,
      userId: user.id,
      expiresAt,
      ip,
      userAgent,
    });
    return { accessToken, refreshToken, refreshTokenId: saved.id };
  }

  private toResponse(user: User): ResponseUserDto {
    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }
}

