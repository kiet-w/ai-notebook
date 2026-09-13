import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from 'nestjs-pino';
import { UserModule } from './user/user.module';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

function sanitizePayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizePayload);
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (
      /password|token|secret|refreshToken|accessToken|cookie|authorization/i.test(
        key,
      )
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 30, // max 30 requests per minute per IP
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
        genReqId: (req: Request, res: Response) => {
          const existingId =
            req.headers['x-request-id'] || req.headers['x-correlation-id'];
          const id =
            (Array.isArray(existingId) ? existingId[0] : existingId) ||
            randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        transport: isProduction
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            },
        serializers: {
          req: (req: {
            id?: string;
            method?: string;
            url?: string;
            query?: unknown;
            params?: unknown;
            raw?: { body?: unknown };
          }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            body: sanitizePayload(req.raw?.body),
          }),
          res: (res: { statusCode?: number }) => ({
            statusCode: res.statusCode,
          }),
        },
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        customSuccessMessage: (req, res, responseTime) => {
          return `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
        },
        customErrorMessage: (req, res, err) => {
          return `${req.method} ${req.url} ${res.statusCode} - ${err?.message || 'Error'}`;
        },
      },
    }),
    PrismaModule,
    NotesModule,
    UserModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
