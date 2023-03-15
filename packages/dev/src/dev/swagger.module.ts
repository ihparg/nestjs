import { DynamicModule, Module, Provider } from '@nestjs/common'
import { DevService } from './dev.service'
import { SwaggerController } from './swagger.controller'
import { DevOption, DevOptionAsync } from './interface'
import { DEV_OPTION } from './constants'

@Module({})
export class SwaggerModule {
  static forRoot(option: DevOption): DynamicModule {
    const providers: Provider[] = [
      DevService,
      {
        provide: DEV_OPTION,
        useValue: option,
      },
    ]

    const module: DynamicModule = {
      module: SwaggerModule,
      controllers: [SwaggerController],
      providers: [...providers],
    }

    return module
  }

  static forRootAsync(option: DevOptionAsync): DynamicModule {
    const providers: Provider[] = [
      DevService,
      {
        provide: DEV_OPTION,
        useFactory: option.useFactory,
        inject: option.inject || [],
      },
    ]

    const module: DynamicModule = {
      module: SwaggerModule,
      controllers: [SwaggerController],
      providers: [...providers],
    }

    return module
  }
}
