import { Module } from '@nestjs/common'
import { DevController } from './dev.controller'
import { RouteController } from './route.controller'
import { DevService } from './dev.service'
import { SchemaController } from './schema.controller'
import { ConfigModule } from '@nestjs/config'
import { ResolveController } from './resolve.controller'

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [
    DevController,
    RouteController,
    SchemaController,
    ResolveController,
  ],
  providers: [DevService],
})
export class DevModule {}
