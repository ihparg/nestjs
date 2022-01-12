import { HttpException, HttpStatus } from '@nestjs/common'

export class ResponseValidatorException extends HttpException {
  result: any
  errors: string[]

  constructor(errors: string[], result: any) {
    const message = errors.join(';')
    super(message, HttpStatus.INTERNAL_SERVER_ERROR)

    this.errors = errors
    this.result = result
  }
}
