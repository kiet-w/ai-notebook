# User Core & Password Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bảo đảm User entity có thể lưu mật khẩu đã hash an toàn bằng Argon2, không bao giờ trả về `password` trong bất kỳ response API nào, và sẵn sàng để tích hợp JWT sau.

**Architecture:** Argon2 hash password trong `UserService.create()` và `UserService.update()` trước khi ghi xuống DB. `ResponseUserDto` dùng `@Exclude()` + `plainToInstance` để strip field `password` tại tầng service. Prisma schema đã có field `password String @db.Text` — không cần migration mới cho bước này. Relation `refresh_tokens` sẽ **không** được thêm ở bước này theo nguyên tắc YAGNI (sẽ làm khi implement Refresh Token thực sự).

**Tech Stack:** NestJS 11, Prisma 7, argon2 ^0.44.0 (đã có trong package.json), class-transformer, class-validator, Jest (unit test)

---

## File Map

| Action | File | Trách nhiệm |
|--------|------|-------------|
| Modify | `backend/src/user/user.service.ts` | Hash password trước khi create/update |
| Modify | `backend/src/user/dto/create-user.dto.ts` | Thêm validation `@MaxLength` cho password |
| **Verify** | `backend/src/user/dto/response-user.dto.ts` | Xác nhận KHÔNG có field `password` (đã đúng) |
| Create | `backend/src/user/user.service.spec.ts` | Unit tests cho hashing & response sanitization |

> **Lưu ý:** `ResponseUserDto` hiện tại đã dùng `@Exclude()` class-level + `@Expose()` chỉ trên các field cần thiết — field `password` **không** có `@Expose()` nên đã bị exclude. Không cần sửa file này.

---

## Task 1: Xác minh argon2 đã được cài và build được

**Files:**
- Verify: `backend/package.json` (dependency `"argon2": "^0.44.0"`)

- [ ] **Step 1: Kiểm tra argon2 đã cài trong node_modules**

```bash
cd backend
ls node_modules | grep argon2
```

Expected output:
```
argon2
```

Nếu không thấy → chạy `npm install`.

- [ ] **Step 2: Smoke test argon2 import**

```bash
cd backend
node -e "const argon2 = require('argon2'); argon2.hash('test123').then(h => console.log('OK:', h.slice(0, 20)))"
```

Expected output (prefix thay đổi mỗi lần):
```
OK: $argon2id$v=19$m=65
```

- [ ] **Step 3: Commit checkpoint**

```bash
git add -A
git commit -m "chore: verify argon2 dependency is installed and working"
```

---

## Task 2: Viết unit test cho UserService (TDD - viết test trước)

**Files:**
- Create: `backend/src/user/user.service.spec.ts`

Codebase dùng Jest với rootDir = `src`. Test file phải nằm trong `src/`.

- [ ] **Step 1: Tạo file `backend/src/user/user.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './repository/user.repository';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'user-uuid-1',
  user: 'testuser',
  email: 'test@example.com',
  password: '$argon2id$v=19$m=65536,t=3,p=4$hashed_password',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const mockRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  // ── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should hash the password with argon2 before saving', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(makeUser());

      await service.create({
        user: 'testuser',
        email: 'test@example.com',
        password: 'plaintext123',
      });

      // Repo phải được gọi với password ĐÃ HASH — không phải plaintext
      const calledWith = mockRepo.create.mock.calls[0][0];
      expect(calledWith.password).not.toBe('plaintext123');
      expect(calledWith.password).toMatch(/^\$argon2/);
    });

    it('should return ResponseUserDto without password field', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(makeUser());

      const result = await service.create({
        user: 'testuser',
        email: 'test@example.com',
        password: 'plaintext123',
      });

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', 'user-uuid-1');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.create({
          user: 'testuser',
          email: 'test@example.com',
          password: 'plaintext123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── update() ──────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should hash the new password with argon2 when password is updated', async () => {
      mockRepo.findById.mockResolvedValue(makeUser());
      mockRepo.update.mockResolvedValue(
        makeUser({ password: '$argon2id$v=19$new_hash' }),
      );

      await service.update('user-uuid-1', { password: 'newpassword456' });

      const calledWith = mockRepo.update.mock.calls[0][1];
      expect(calledWith.password).not.toBe('newpassword456');
      expect(calledWith.password).toMatch(/^\$argon2/);
    });

    it('should NOT include password in update data if password field is absent', async () => {
      mockRepo.findById.mockResolvedValue(makeUser());
      mockRepo.update.mockResolvedValue(
        makeUser({ email: 'new@example.com' }),
      );

      // Chỉ update email, không update password
      await service.update('user-uuid-1', { email: 'new@example.com' });

      const calledWith = mockRepo.update.mock.calls[0][1];
      // password key không được xuất hiện trong data gửi lên repo
      expect(calledWith.password).toBeUndefined();
    });

    it('should return ResponseUserDto without password field after update', async () => {
      mockRepo.findById.mockResolvedValue(makeUser());
      mockRepo.update.mockResolvedValue(makeUser());

      const result = await service.update('user-uuid-1', {
        email: 'new@example.com',
      });

      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { password: 'newpass' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findAll() ─────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return list of users WITHOUT password field', async () => {
      mockRepo.findAll.mockResolvedValue([makeUser(), makeUser({ id: 'user-uuid-2' })]);

      const results = await service.findAll();

      expect(results).toHaveLength(2);
      results.forEach((r) => {
        expect(r).not.toHaveProperty('password');
      });
    });
  });

  // ── findOne() ─────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('should return user WITHOUT password field', async () => {
      mockRepo.findById.mockResolvedValue(makeUser());

      const result = await service.findOne('user-uuid-1');

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', 'user-uuid-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận chúng FAIL (TDD — red phase)**

```bash
cd backend
npx jest user.service.spec.ts --no-coverage 2>&1 | tail -30
```

Expected: Tests fail vì `UserService.create()` hiện tại chưa hash password.

Ví dụ output mong đợi:
```
● UserService › create() › should hash the password with argon2 before saving

  expect(received).toMatch(expected)

  Expected pattern: /^\$argon2/
  Received string: "plaintext123"
```

Nếu test **PASS** ngay — dừng lại và kiểm tra lại logic, có thể code đã được sửa trước.

---

## Task 3: Implement hashing trong UserService

**Files:**
- Modify: `backend/src/user/user.service.ts`

- [ ] **Step 1: Thay toàn bộ nội dung `backend/src/user/user.service.ts`**

```typescript
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { UserRepository } from './repository/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(dto: CreateUserDto): Promise<ResponseUserDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.toResponse(user);
  }

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
    await this.findOne(id); // throws 404 nếu không tồn tại

    const updateData: UpdateUserDto = { ...dto };
    if (dto.password) {
      updateData.password = await argon2.hash(dto.password);
    }

    const user = await this.userRepository.update(id, updateData);
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
```

- [ ] **Step 2: Chạy tests — phải PASS hết**

```bash
cd backend
npx jest user.service.spec.ts --no-coverage 2>&1 | tail -10
```

Expected:
```
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

- [ ] **Step 3: Kiểm tra TypeScript không có lỗi**

```bash
cd backend
npx tsc --noEmit 2>&1
```

Expected: không có output (= 0 errors).

- [ ] **Step 4: Chạy ESLint**

```bash
cd backend
npx eslint "src/user/user.service.ts" --max-warnings=0
```

Expected: không có output (= 0 warnings, 0 errors).

- [ ] **Step 5: Commit**

```bash
git add backend/src/user/user.service.ts backend/src/user/user.service.spec.ts
git commit -m "feat(user): hash password with argon2 on create and update"
```

---

## Task 4: Kiểm tra ResponseUserDto đã exclude password đúng

**Files:**
- Verify: `backend/src/user/dto/response-user.dto.ts`

- [ ] **Step 1: Đọc `response-user.dto.ts` và xác nhận cấu trúc**

Mở file và kiểm tra có đúng như sau không:

```typescript
@Exclude()              // ← class-level: mặc định ẩn TẤT CẢ fields
export class ResponseUserDto {
  @Expose() id!: string;
  @Expose() user!: string;
  @Expose() email!: string;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
  // KHÔNG CÓ @Expose() trên password → password bị ẩn tự động
}
```

Nếu `password` có `@Expose()` → xóa dòng `@Expose()` ngay trên field `password`.

- [ ] **Step 2: Chạy lại toàn bộ test**

```bash
cd backend
npx jest --no-coverage 2>&1 | tail -10
```

Expected: tất cả pass.

- [ ] **Step 3: Commit checkpoint**

```bash
git add -A
git commit -m "test(user): verify password excluded from all API responses"
```

---

## Task 5: Thêm MaxLength(72) cho password trong CreateUserDto

**Files:**
- Modify: `backend/src/user/dto/create-user.dto.ts`

> **Tại sao 72?** Argon2 xử lý tối đa 72 bytes của password. Chuỗi dài hơn không tăng security nhưng tốn CPU — giới hạn ở 72 là best practice để tránh DoS.

- [ ] **Step 1: Thay toàn bộ nội dung `backend/src/user/dto/create-user.dto.ts`**

```typescript
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class CreateUserDto {
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username must be less than 20 characters' })
  user!: string;

  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : (value as unknown),
  )
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(72, { message: 'Password must be at most 72 characters long' })
  password!: string;
}
```

- [ ] **Step 2: Kiểm tra TypeScript**

```bash
cd backend
npx tsc --noEmit 2>&1
```

Expected: không có output.

- [ ] **Step 3: Chạy lại toàn bộ test**

```bash
cd backend
npx jest --no-coverage 2>&1 | tail -10
```

Expected: tất cả pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/user/dto/create-user.dto.ts
git commit -m "feat(user): add MaxLength(72) to password to prevent DoS on argon2"
```

---

## Task 6: Final verification — build sạch

- [ ] **Step 1: Build production bundle**

```bash
cd backend
npm run build 2>&1 | tail -10
```

Expected: không có error output.

- [ ] **Step 2: Chạy toàn bộ test suite lần cuối**

```bash
cd backend
npx jest --no-coverage 2>&1 | tail -10
```

Expected: 
```
Test Suites: N passed, N total
Tests:       M passed, M total
```

- [ ] **Step 3: Lint toàn bộ codebase**

```bash
cd backend
npm run lint 2>&1 | grep -E "error|warning" | head -20
```

Expected: không có output (0 errors, 0 warnings).

- [ ] **Step 4: Commit tổng kết**

```bash
git add -A
git commit -m "feat(user): complete Step 1 - password hashing with argon2, exclude from responses"
```

---

## Checklist tự review

- [ ] `argon2` đã cài và chạy được
- [ ] `UserService.create()` hash password trước khi gọi `userRepository.create()`
- [ ] `UserService.update()` hash password khi `dto.password` tồn tại, skip khi không có
- [ ] `ResponseUserDto` không có `@Expose()` trên field `password`
- [ ] `plainToInstance` dùng `excludeExtraneousValues: true` trong `toResponse()`
- [ ] `CreateUserDto` có `@MaxLength(72)` trên password
- [ ] `npx tsc --noEmit` không có lỗi
- [ ] `npm run lint` không có warning
- [ ] Tất cả Jest tests pass

---

## Những gì KHÔNG làm ở bước này (YAGNI)

- ❌ Không tạo bảng `refresh_tokens` — chỉ tạo khi implement Refresh Token thực sự
- ❌ Không setup JWT, Passport, Guards — đó là bước tiếp theo
- ❌ Không tạo `AuthModule` hay `AuthService` — chưa cần
- ❌ Không thêm `findByEmailWithPassword()` riêng — chỉ cần khi build login endpoint
