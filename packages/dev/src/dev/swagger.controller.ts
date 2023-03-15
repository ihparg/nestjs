import { Controller, Get } from '@nestjs/common'
import { DevService } from './dev.service'
import { UnTransform } from './interceptor'

@Controller()
export class SwaggerController {
  constructor(private readonly devService: DevService) {}

  @Get('/swagger')
  @UnTransform()
  getSwagger() {
    return this.devService.getSwagger()
  }
}
