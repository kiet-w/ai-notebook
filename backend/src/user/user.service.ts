import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { UserRepository } from './repository/user.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthResponseDto } from './dto/response-token.dto';
import { CheckEmailException } from '../common/exceptions/auth/check-email.exception';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { VerifyPasswordException } from '../common/exceptions/auth/verify-password.exception';
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async refresh(
    refreshToken: string,
    ip: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const savedToken =
      await this.userRepository.findRefreshTokenWithUser(tokenHash);

    if (!savedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (savedToken.isRevoked) {
      // Reuse detection: If token is revoked, revoke the whole family
      await this.userRepository.revokeTokenFamily(savedToken.family);
      throw new UnauthorizedException('Token reuse detected. Family revoked.');
    }

    if (savedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new token
    const newTokens = await this.issueToken(
      savedToken.user,
      ip,
      userAgent,
      savedToken.family,
    );

    // Revoke old token and link to new one
    await this.userRepository.revokeAndReplaceToken(
      savedToken.id,
      newTokens.refreshTokenId,
    );

    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const savedToken = await this.userRepository.findRefreshToken(tokenHash);

    if (!savedToken || savedToken.isRevoked) {
      // If not found or already revoked, logout is effectively complete
      return;
    }

    await this.userRepository.revokeToken(savedToken.id);
  }

  async findAll(): Promise<ResponseUserDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((u) => this.toResponse(u));
  }

  async register(
    dto: CreateUserDto,
    ip: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    const userEmail = await this.userRepository.findByEmail(dto.email);
    if (userEmail) throw new CheckEmailException();

    const existingUsername = await this.userRepository.findByUsername(dto.user);
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await argon2.hash(dto.password);
    const saveUser = await this.userRepository.create({
      email: dto.email,
      password: passwordHash,
      user: dto.user,
    });
    const family = randomUUID();
    return this.issueToken(saveUser, ip, userAgent, family);
  }

  async login(
    dto: LoginDto,
    ip: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new VerifyPasswordException();
    const comparePassword = await argon2.verify(user.password, dto.password);
    if (!comparePassword) throw new VerifyPasswordException();
    const family = randomUUID();
    return this.issueToken(user, ip, userAgent, family);
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
    const saveToken = await this.userRepository.createRefreshToken({
      tokenHash,
      family,
      ip,
      userAgent,
      expiresAt,
      userId: user.id,
    });
    return {
      accessToken,
      refreshToken,
      refreshTokenId: saveToken.id,
    };
  }

  private toResponse(user: User): ResponseUserDto {
    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
