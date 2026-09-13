import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status: number =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let message: string | string[] = 'Internal server error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const resObj = exceptionResponse as Record<string, unknown>;
      if (typeof resObj.message === 'string') {
        message = resObj.message;
      } else if (Array.isArray(resObj.message)) {
        message = resObj.message.map((m) => String(m));
      }
    }

    const reqIdStr =
      typeof request.id === 'string' || typeof request.id === 'number'
        ? `[reqId: ${request.id}] `
        : '';
    const formattedMsg = Array.isArray(message) ? message.join(', ') : message;

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${reqIdStr}${request.method} ${request.url} ${status} - Server Error: ${formattedMsg}`,
        stack,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${reqIdStr}${request.method} ${request.url} ${status} - Client Error: ${formattedMsg}`,
      );
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      response.status(status).json(exceptionResponse);
    } else {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
