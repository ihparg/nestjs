import { Controller, Get, Query } from '@nestjs/common'
import { ResponseValidator } from './dev'
import { DemoResponse } from './dto'

@Controller()
export class AppController {
  @Get('/single')
  @ResponseValidator(DemoResponse)
  single(@Query() query: DemoResponse): DemoResponse {
    const result = { id: 1, age: 20, extra: 3 }
    return result
  }
}
