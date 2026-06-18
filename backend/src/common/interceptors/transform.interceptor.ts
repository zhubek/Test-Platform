import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Consistent response envelope. Payloads that are already enveloped (objects
 * carrying a `data` key — e.g. GET's `{ data, capabilities }`) pass through
 * untouched; everything else is wrapped as `{ data }`.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && 'data' in payload) return payload;
        return { data: payload ?? null };
      }),
    );
  }
}
