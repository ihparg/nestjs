import { iterate } from 'iterare'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
import { ValidationError } from '@nestjs/common'
import { ClassConstructor, ResponseFunction } from './interface'

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

interface Result<T> {
  code: number
  data: T
  validateErrors?: string[]
}

let responseWrap: ResponseFunction = function <T>(data: T, errors: ValidationError[]): Result<T> {
  const validateErrors = flattenValidationErrors(errors)
  const result: Result<T> = { code: 200, data }
  if (validateErrors.length > 0) result.validateErrors = validateErrors
  return result
}

export function customResponse(fn: ResponseFunction) {
  responseWrap = fn
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

      return responseWrap(result, errors)
    }
    return descriptor
  }
}
