import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Response } from './interface'

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<any>> {
    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest()
        if (request.url.startsWith('/dev')) return data
        return typeof data === 'object' ? { code: 200, data } : data
      }),
    )
  }
}
