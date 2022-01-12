import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { TransformInterceptor, ValidationPipe } from './dev'
import { CustomExceptionFilter } from './exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalFilters(new CustomExceptionFilter())
  await app.listen(3009)
}
bootstrap()
