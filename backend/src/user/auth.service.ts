import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { UserRepository } from './repository/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/response-token.dto';
import { CheckEmailException } from '../common/exceptions/auth/check-email.exception';
import { VerifyPasswordException } from '../common/exceptions/auth/verify-password.exception';
import { hashPassword, verifyPassword } from './utils/password.util';
import {
  calculateTokenExpiry,
  generateRefreshToken,
  hashToken,
} from './utils/token.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

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

    const hashedPassword = await hashPassword(dto.password);
    const saveUser = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
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
    const isPasswordValid = await verifyPassword(user.password, dto.password);
    if (!isPasswordValid) throw new VerifyPasswordException();
    const family = randomUUID();
    return this.issueToken(user, ip, userAgent, family);
  }

  async refresh(
    refreshToken: string,
    ip: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    const tokenHash = hashToken(refreshToken);
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
    const tokenHash = hashToken(refreshToken);
    const savedToken = await this.userRepository.findRefreshToken(tokenHash);

    if (!savedToken || savedToken.isRevoked) {
      // If not found or already revoked, logout is effectively complete
      return;
    }

    await this.userRepository.revokeToken(savedToken.id);
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
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = calculateTokenExpiry(7);
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
}
