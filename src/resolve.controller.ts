import { Controller, Get } from '@nestjs/common'
import { DevService } from './dev.service'
import { resolves } from './resolvable'

@Controller('dev/resolve')
export class ResolveController {
  constructor(private readonly devService: DevService) {}

  @Get('/list')
  getList(): any {
    return resolves
  }
}
