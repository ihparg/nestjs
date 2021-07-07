import { Body, Controller, Delete, Get, Post } from '@nestjs/common'
import { DevService } from './dev.service'
import { ControllerGenerator } from './generators/controller'
import { IRoute, IDeleteBody } from './interface'

@Controller('dev/route')
export class RouteController {
  constructor(private readonly devService: DevService) {}

  get dir(): string {
    return process.env.DEV_ROUTE_PATH || 'data/routes'
  }

  @Get('/')
  getList(): Promise<Array<IRoute>> {
    return this.devService.getJsonFileList(this.dir)
  }

  @Get('/config')
  getConfig() {
    return { prefix: process.env.API_PREFIX }
  }

  @Post('/save')
  async saveRoute(@Body() body: IRoute): Promise<IRoute> {
    if (!body.id) body.id = this.devService.nextUid()
    await this.devService.saveFile(
      this.devService.resolvePath(this.dir, body.id),
      body,
    )

    const routes = await this.getList()
    const { DEV_CONTROLLER_PATH } = process.env
    if (DEV_CONTROLLER_PATH) {
      new ControllerGenerator(routes).generate(body, DEV_CONTROLLER_PATH)
    }

    return body
  }

  @Delete('/')
  async deleteRoute(@Body() body: IDeleteBody) {
    await this.devService.deleteFile(
      this.devService.resolvePath(this.dir, body.id),
    )
  }
}
