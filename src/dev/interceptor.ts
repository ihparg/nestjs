import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Response } from './interface'

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<any>> {
    return next.handle().pipe(
      map((data) => {
        const contentType: string = context.switchToHttp().getResponse().getHeader('content-type')

        if (contentType) {
          if (contentType.indexOf('json') > 0) return { code: 200, data }
          else return data
        }

        return typeof data !== 'object' ? data : { code: 200, data }
      }),
    )
  }
}
