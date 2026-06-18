import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Request duration for every request. Errors themselves are logged by the filter. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Request');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${method} ${url} ${Date.now() - start}ms`),
        error: () => this.logger.warn(`${method} ${url} FAILED ${Date.now() - start}ms`),
      }),
    );
  }
}
