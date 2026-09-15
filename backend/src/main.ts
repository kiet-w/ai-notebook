import * as dotenv from 'dotenv';
dotenv.config({ override: true });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  app.useLogger(app.get(Logger));

  app.use(cookieParser());
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        origin,
      );
      const isPagesDev = /^https:\/\/[a-zA-Z0-9-.]+\.pages\.dev$/.test(origin);
      const isVercelApp = /^https:\/\/[a-zA-Z0-9-.]+\.vercel\.app$/.test(
        origin,
      );
      const isExplicitOrigin = allowedOrigins.includes(
        origin.replace(/\/$/, ''),
      );

      if (isLocalhost || isPagesDev || isVercelApp || isExplicitOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  });
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
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3001).catch((err) => {
    console.error(err);
  });
}
bootstrap().catch((err) => {
  console.error(err);
});
