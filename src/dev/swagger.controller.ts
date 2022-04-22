import { Controller, Get } from '@nestjs/common'
import { DevService } from './dev.service'

@Controller('dev')
export class SwaggerController {
  constructor(private readonly devService: DevService) {}

  @Get('/swagger')
  getSwagger() {
    return this.devService.getSwagger()
  }
}
