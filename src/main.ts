import { NestFactory } from '@nestjs/core'
import { DevModule } from './dev.module'

async function bootstrap() {
  const app = await NestFactory.create(DevModule)
  await app.listen(3009)
}
bootstrap()
