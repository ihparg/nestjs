import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { UN_TRANSFORM } from './constants'
import { Response } from './interface'

export function UnTransform() {
  return function UnTransformImpl(_target, _key, descriptor) {
    Reflect.defineMetadata(UN_TRANSFORM, true, descriptor.value)
    return descriptor
  }
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<any>> {
    return next.handle().pipe(
      map((data) => {
        const ignore = Reflect.getMetadata(UN_TRANSFORM, context.getHandler())
        if (ignore) return data

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
