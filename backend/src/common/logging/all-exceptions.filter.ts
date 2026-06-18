import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * The single place every thrown error is logged, so nothing slips through.
 * 5xx -> error (with stack), 4xx -> warn. Never log inside handlers/services.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const message =
      exception instanceof HttpException ? exception.message : 'Internal error';

    const payload = `${req.method} ${req.url} -> ${status} : ${message}`;
    if (status >= 500) {
      this.logger.error(payload, (exception as Error)?.stack);
    } else {
      this.logger.warn(payload);
    }

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
