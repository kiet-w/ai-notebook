/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../repository/user.repository';
import { NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
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

      const result = await service.update(mockUser.id, {
        email: 'new@email.com',
      });
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ email: 'new@email.com' }),
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
