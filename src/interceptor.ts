import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Response } from './interface'

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<any>> {
    return next.handle().pipe(
      map((data) => {
        let code = context.switchToHttp().getResponse().statusCode
        if (code === 201) code = 200
        return { code, data }
      }),
    )
  }
}
