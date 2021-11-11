import { DynamicModule, Module, Provider } from '@nestjs/common'
import { DevController } from './dev.controller'
import { RouteController } from './route.controller'
import { DevService } from './dev.service'
import { SchemaController } from './schema.controller'
import { ResolveController } from './resolve.controller'
import { DevOption } from './interface'
import { DEV_OPTION } from './constants'

@Module({})
export class DevModule {
  static forRoot(option: DevOption): DynamicModule {
    const providers: Provider[] = [
      DevService,
      {
        provide: DEV_OPTION,
        useValue: option,
      },
    ]

    const module: DynamicModule = {
      module: DevModule,
      controllers: [DevController, RouteController, SchemaController, ResolveController],
      providers: [...providers],
    }

    return module
  }
}
