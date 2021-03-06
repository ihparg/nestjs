import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  private logger: Logger = new Logger('CustomExceptionFilter')

  catch(exception: HttpException, host: ArgumentsHost) {
    console.log(exception)

    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = exception.getStatus()

    this.logger.error(exception.message, exception.stack)

    response.status(200).json({
      code: status,
      message: exception.message,
    })
  }
}
