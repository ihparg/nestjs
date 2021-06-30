import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common'
import { DevService } from './dev.service'
import { TransformInterceptor } from './interceptor'
import { IRoute, IDeleteBody } from './interface'

@Controller('dev/route')
@UseInterceptors(TransformInterceptor)
export class RouteController {
  constructor(private readonly devService: DevService) {}

  get dir(): string {
    return process.env.DEV_ROUTE_PATH || 'data/routes'
  }

  @Get('/')
  getList(): Promise<Array<IRoute>> {
    return this.devService.getJsonFileList(this.dir)
  }

  @Post('/save')
  async saveRoute(@Body() body: IRoute): Promise<IRoute> {
    if (!body.id) body.id = this.devService.nextUid()
    await this.devService.saveFile(
      this.devService.resolvePath(this.dir, body.id),
      body,
    )
    return body
  }

  @Delete('/')
  async deleteRoute(@Body() body: IDeleteBody) {
    await this.devService.deleteFile(
      this.devService.resolvePath(this.dir, body.id),
    )
  }
}
