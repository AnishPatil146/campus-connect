import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        // If data already matches the unified response structure, return it directly
        if (data && typeof data === 'object' && 'success' in data && 'message' in data) {
          return data;
        }
        
        // Otherwise, wrap it into the standard format
        const message = data && typeof data === 'object' && 'message' in data ? data.message : 'Operation successful';
        const resultData = data && typeof data === 'object' && 'data' in data ? data.data : (data && typeof data === 'object' && 'message' in data ? null : data);

        return {
          success: true,
          message,
          data: resultData === undefined ? null : resultData,
        };
      }),
    );
  }
}
