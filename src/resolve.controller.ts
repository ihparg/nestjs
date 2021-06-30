import { Controller, Get, UseInterceptors } from '@nestjs/common'
import { DevService } from './dev.service'
import { TransformInterceptor } from './interceptor'

@Controller('dev/resolve')
@UseInterceptors(TransformInterceptor)
export class ResolveController {
  constructor(private readonly devService: DevService) {}

  @Get('/list')
  getList(): any {
    return []
  }
}
