import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('UserController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.refreshToken.deleteMany();
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /users/register', () => {
    it('should create a new user', () => {
      const userData = {
        user: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      return request(app.getHttpServer())
        .post('/users/register')
        .send(userData)
        .expect(201)
        .expect((res) => {
          const body = res.body as { accessToken: string };
          expect(body).toHaveProperty('accessToken');
          expect(body.accessToken).toBeDefined();
          expect(res.headers['set-cookie']).toBeDefined();
        });
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        user: 'testuser2',
        email: 'existing@example.com',
        password: 'Password123',
      };

      await request(app.getHttpServer())
        .post('/users/register')
        .send(userData)
        .expect(201);

      return request(app.getHttpServer())
        .post('/users/register')
        .send({ ...userData, user: 'differentuser' })
        .expect(400);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .send({ user: 'test' })
        .expect(400); // Validation pipe will throw 400
    });
  });

  describe('POST /users/login', () => {
    const userData = {
      user: 'logintest',
      email: 'login@example.com',
      password: 'Password123',
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/users/register')
        .send(userData)
        .expect(201);
    });

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as { accessToken: string };
          expect(body).toHaveProperty('accessToken');
          expect(body.accessToken).toBeDefined();
          expect(res.headers['set-cookie']).toBeDefined();
        });
    });

    it('should throw error with invalid email', () => {
      return request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: 'wrong@example.com',
          password: userData.password,
        })
        .expect(400);
    });

    it('should throw error with invalid password', () => {
      return request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(400);
    });
  });

  afterAll(async () => {
    // Clean up database after all tests
    await prisma.refreshToken.deleteMany();
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });
});
