/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserRepository } from '../repository/user.repository';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { CheckEmailException } from '../../common/exceptions/auth/check-email.exception';
import { VerifyPasswordException } from '../../common/exceptions/auth/verify-password.exception';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            createRefreshToken: jest.fn(),
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
            findRefreshTokenWithUser: jest.fn(),
            revokeTokenFamily: jest.fn(),
            revokeAndReplaceToken: jest.fn(),
            revokeToken: jest.fn(),
            findRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('new-access-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get<UserRepository>(UserRepository);
    jest.clearAllMocks();
  });

  const mockUser: User = {
    id: 'user-1',
    user: 'testuser',
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('register', () => {
    it('should throw CheckEmailException if email exists', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      await expect(
        service.register(
          { email: 'test@example.com', password: 'password', user: 'testuser' },
          '127.0.0.1',
          'test-agent',
        ),
      ).rejects.toThrow(CheckEmailException);
    });

    it('should create and return AuthResponseDto', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userRepository, 'findByUsername').mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      jest.spyOn(userRepository, 'create').mockResolvedValue(mockUser);
      jest
        .spyOn(userRepository, 'createRefreshToken')
        .mockResolvedValue({ id: 'token-id' } as any);

      const result = await service.register(
        { email: 'test@example.com', password: 'password', user: 'testuser' },
        '127.0.0.1',
        'test-agent',
      );
      expect(result.accessToken).toBeDefined();
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed' }),
      );
    });
  });

  describe('login', () => {
    const ip = '127.0.0.1';
    const userAgent = 'test-agent';

    it('should throw VerifyPasswordException if user not found', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      await expect(
        service.login(
          { email: 'test@example.com', password: 'password' },
          ip,
          userAgent,
        ),
      ).rejects.toThrow(VerifyPasswordException);
    });

    it('should throw VerifyPasswordException if password does not match', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login(
          { email: 'test@example.com', password: 'password' },
          ip,
          userAgent,
        ),
      ).rejects.toThrow(VerifyPasswordException);
    });

    it('should return AuthResponseDto on success', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jest
        .spyOn(userRepository, 'createRefreshToken')
        .mockResolvedValue({ id: 'token-id' } as any);

      const result = await service.login(
        { email: 'test@example.com', password: 'password' },
        ip,
        userAgent,
      );
      expect(result.accessToken).toEqual('new-access-token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('refresh', () => {
    const refreshToken = 'valid-token';
    const ip = '127.0.0.1';
    const userAgent = 'test-agent';

    it('should throw UnauthorizedException if token is not found', async () => {
      jest
        .spyOn(userRepository, 'findRefreshTokenWithUser')
        .mockResolvedValue(null);
      await expect(
        service.refresh(refreshToken, ip, userAgent),
      ).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
    });

    it('should revoke family and throw UnauthorizedException if token reuse is detected', async () => {
      const savedToken = {
        family: 'family-1',
        isRevoked: true,
        user: mockUser,
      };
      jest
        .spyOn(userRepository, 'findRefreshTokenWithUser')
        .mockResolvedValue(savedToken as any);
      jest
        .spyOn(userRepository, 'revokeTokenFamily')
        .mockResolvedValue({ count: 1 });

      await expect(
        service.refresh(refreshToken, ip, userAgent),
      ).rejects.toThrow(
        new UnauthorizedException('Token reuse detected. Family revoked.'),
      );
      expect(userRepository.revokeTokenFamily).toHaveBeenCalledWith(
        savedToken.family,
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const savedToken = {
        isRevoked: false,
        expiresAt: new Date(Date.now() - 10000),
        user: mockUser,
      };
      jest
        .spyOn(userRepository, 'findRefreshTokenWithUser')
        .mockResolvedValue(savedToken as any);
      await expect(
        service.refresh(refreshToken, ip, userAgent),
      ).rejects.toThrow(new UnauthorizedException('Refresh token expired'));
    });

    it('should issue new tokens, revoke old token, and return new AuthResponseDto', async () => {
      const savedToken = {
        id: 'old-token-id',
        family: 'family-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 10000),
        user: mockUser,
      };
      const newlySavedToken = { id: 'new-token-id' };

      jest
        .spyOn(userRepository, 'findRefreshTokenWithUser')
        .mockResolvedValue(savedToken as any);
      jest
        .spyOn(userRepository, 'createRefreshToken')
        .mockResolvedValue(newlySavedToken as any);
      jest
        .spyOn(userRepository, 'revokeAndReplaceToken')
        .mockResolvedValue(null as any);

      const result = await service.refresh(refreshToken, ip, userAgent);
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(userRepository.revokeAndReplaceToken).toHaveBeenCalledWith(
        savedToken.id,
        newlySavedToken.id,
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshTokenId).toBe(newlySavedToken.id);
    });
  });

  describe('logout', () => {
    it('should revoke token if token exists and is not revoked', async () => {
      const savedToken = { id: 'tok-1', isRevoked: false };
      jest
        .spyOn(userRepository, 'findRefreshToken')
        .mockResolvedValue(savedToken as any);
      jest
        .spyOn(userRepository, 'revokeToken')
        .mockResolvedValue(undefined as any);

      await service.logout('valid-token');
      expect(userRepository.revokeToken).toHaveBeenCalledWith('tok-1');
    });

    it('should do nothing if token does not exist or is revoked', async () => {
      jest.spyOn(userRepository, 'findRefreshToken').mockResolvedValue(null);
      await service.logout('missing-token');
      expect(userRepository.revokeToken).not.toHaveBeenCalled();
    });
  });
});
