import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
import { ClassConstructor } from './interface'

export function Response<T>(cls: ClassConstructor<T>): MethodDecorator {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const fn = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const json = await fn.apply(this, args)
      const result = plainToClass(cls, json)
      let errors: any[] = []
      if (Array.isArray(result)) {
        errors = await Promise.all((result as any).map((r: any) => validate(r, { whitelist: true })))
      } else {
        errors = await validate(result as any, { whitelist: true })
      }
      console.log(errors)
      return { code: 200, data: result }
    }
    return descriptor
  }
}
