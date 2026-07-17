/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repository/user.repository';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { RefreshDto } from './dto/refresh.dto';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { CheckEmailException } from '../common/exceptions/auth/check-email.exception';
import { verifyPasswordException } from '../common/exceptions/auth/verify-password.exception';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            createRefreshToken: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              findUnique: jest.fn(),
              updateMany: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn(),
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

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
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

  describe('create', () => {
    it('should throw CheckEmailException if email exists', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      await expect(
        service.create({
          email: 'test@example.com',
          password: 'password',
          user: 'testuser',
          role: 'user',
        }),
      ).rejects.toThrow(CheckEmailException);
    });

    it('should create and return a user', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      jest.spyOn(userRepository, 'create').mockResolvedValue(mockUser);

      const result = await service.create({
        email: 'test@example.com',
        password: 'password',
        user: 'testuser',
        role: 'user',
      });
      expect(result.email).toEqual(mockUser.email);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed' }),
      );
    });
  });

  describe('login', () => {
    const ip = '127.0.0.1';
    const userAgent = 'test-agent';

    it('should throw CheckEmailException if user not found', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      await expect(
        service.login(
          {
            email: 'test@example.com',
            password: 'password',
            user: 'testuser',
            role: 'user',
          },
          ip,
          userAgent,
        ),
      ).rejects.toThrow(CheckEmailException);
    });

    it('should throw verifyPasswordException if password does not match', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login(
          {
            email: 'test@example.com',
            password: 'password',
            user: 'testuser',
            role: 'user',
          },
          ip,
          userAgent,
        ),
      ).rejects.toThrow(verifyPasswordException);
    });

    it('should return AuthResponseDto on success', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jest
        .spyOn(userRepository, 'createRefreshToken')
        .mockResolvedValue({ id: 'token-id' } as any);

      const result = await service.login(
        {
          email: 'test@example.com',
          password: 'password',
          user: 'testuser',
          role: 'user',
        },
        ip,
        userAgent,
      );
      expect(result.accessToken).toEqual('new-access-token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('refresh', () => {
    const dto: RefreshDto = { refreshToken: 'valid-token' };
    const ip = '127.0.0.1';
    const userAgent = 'test-agent';

    it('should throw UnauthorizedException if token is not found', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(null);
      await expect(service.refresh(dto, ip, userAgent)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('should revoke family and throw UnauthorizedException if token reuse is detected', async () => {
      const savedToken = {
        family: 'family-1',
        isRevoked: true,
        user: mockUser,
      };
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(savedToken as any);
      jest
        .spyOn(prismaService.refreshToken, 'updateMany')
        .mockResolvedValue({ count: 1 });

      await expect(service.refresh(dto, ip, userAgent)).rejects.toThrow(
        new UnauthorizedException('Token reuse detected. Family revoked.'),
      );
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { family: savedToken.family },
        data: { isRevoked: true },
      });
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const savedToken = {
        isRevoked: false,
        expiresAt: new Date(Date.now() - 10000),
        user: mockUser,
      };
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(savedToken as any);
      await expect(service.refresh(dto, ip, userAgent)).rejects.toThrow(
        new UnauthorizedException('Refresh token expired'),
      );
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
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(savedToken as any);
      jest
        .spyOn(userRepository, 'createRefreshToken')
        .mockResolvedValue(newlySavedToken as any);
      jest
        .spyOn(prismaService.refreshToken, 'update')
        .mockResolvedValue(null as any);

      const result = await service.refresh(dto, ip, userAgent);
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: savedToken.id },
        data: { isRevoked: true, replacedByTokenId: newlySavedToken.id },
      });
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshTokenId).toBe(newlySavedToken.id);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      jest.spyOn(userRepository, 'findAll').mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].email).toEqual(mockUser.email);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a user', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      const result = await service.findOne(mockUser.id);
      expect(result.email).toEqual(mockUser.email);
    });
  });

  describe('update', () => {
    it('should update a user (with password)', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      jest.spyOn(userRepository, 'update').mockResolvedValue(mockUser);

      const result = await service.update(mockUser.id, {
        password: 'new-password',
      });
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ password: 'new-hashed-password' }),
      );
      expect(result.email).toEqual(mockUser.email);
    });

    it('should update a user (without password)', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'update').mockResolvedValue(mockUser);

      const result = await service.update(mockUser.id, { user: 'newname' });
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ user: 'newname' }),
      );
      expect(result.email).toEqual(mockUser.email);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'delete').mockResolvedValue(mockUser);

      await service.remove(mockUser.id);
      expect(userRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
