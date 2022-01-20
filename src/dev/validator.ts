import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common'
import { iterate } from 'iterare'
import { plainToClass } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { ClassConstructor } from './interface'
import { ResponseValidatorException } from './exception'

function prependConstraintsWithParentProp(parentPath: string, error: ValidationError): ValidationError {
  const constraints = {}
  for (const key in error.constraints) {
    constraints[key] = `${parentPath}.${error.constraints[key]}`
  }
  return {
    ...error,
    constraints,
  }
}

function mapChildrenToValidationErrors(error: ValidationError, parentPath?: string): ValidationError[] {
  if (!(error.children && error.children.length)) {
    return [error]
  }
  const validationErrors = []
  parentPath = parentPath ? `${parentPath}.${error.property}` : error.property
  for (const item of error.children) {
    if (item.children && item.children.length) {
      validationErrors.push(...mapChildrenToValidationErrors(item, parentPath))
    }
    validationErrors.push(prependConstraintsWithParentProp(parentPath, item))
  }
  return validationErrors
}

export function flattenValidationErrors(validationErrors: ValidationError[]): string[] {
  return iterate(validationErrors)
    .map((error) => mapChildrenToValidationErrors(error))
    .flatten()
    .filter((item) => !!item.constraints)
    .map((item) => Object.values(item.constraints))
    .flatten()
    .toArray()
}

export function ResponseValidator<T>(cls: ClassConstructor<T>): MethodDecorator {
  return function (target: unknown, key: string, descriptor: PropertyDescriptor) {
    const fn = descriptor.value
    descriptor.value = async function (...args: unknown[]) {
      const json = await fn.apply(this, args)
      const result = plainToClass(cls, JSON.parse(JSON.stringify(json)))
      let errors: ValidationError[] = []
      if (Array.isArray(result)) {
        errors = await Promise.all((result as any).map((r: any) => validate(r, { whitelist: true })))
        errors = iterate(errors).flatten().toArray()
      } else {
        errors = await validate(result as any, { whitelist: true })
      }

      if (errors.length > 0) {
        throw new ResponseValidatorException(flattenValidationErrors(errors), result)
      }

      return result
    }
    return descriptor
  }
}

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value
    }
    const object = plainToClass(metatype, value)
    const errors = await validate(object, { whitelist: true })
    if (errors.length > 0) {
      throw new BadRequestException(flattenValidationErrors(errors).join(';'))
    }
    return object
  }

  private toValidate(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object]
    return !types.includes(metatype)
  }
}
