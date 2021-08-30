import { Body, Controller, Delete, Get, Post } from '@nestjs/common'
import { DevService } from './dev.service'
import { ControllerGenerator } from './generators/controller'
import { Route, DeleteBody } from './interface'

const getFullPath = (route: Route): string => {
  const path = [route.method]
  if (route.module) path.push(route.module)
  path.push(route.path)
  return path.join('/')
}

@Controller('dev/route')
export class RouteController {
  constructor(private readonly devService: DevService) {}

  get dir(): string {
    return process.env.DEV_ROUTE_PATH || 'data/routes'
  }

  @Get('/')
  getList(): Promise<Array<Route>> {
    return this.devService.getJsonFileList(this.dir)
  }

  @Get('/config')
  getConfig() {
    return { prefix: process.env.API_PREFIX }
  }

  @Post('/save')
  async saveRoute(@Body() body: Route): Promise<Route> {
    if (!body.id) body.id = this.devService.nextUid()

    const routes = await this.getList()
    const fullPath = getFullPath(body)
    routes.forEach((route) => {
      if (fullPath === getFullPath(route) && body.id !== route.id) {
        throw new Error('路径已经存在')
      }
    })

    await this.devService.saveFile(this.devService.resolvePath(this.dir, body.id), body)

    const { DEV_CONTROLLER_PATH } = process.env
    if (DEV_CONTROLLER_PATH) {
      const schemas = await this.devService.getJsonFileList(process.env.DEV_SCHEMA_PATH || 'data/schemas')

      const cg = new ControllerGenerator(routes, schemas, DEV_CONTROLLER_PATH)
      await cg.generate(body)
    }

    return body
  }

  @Delete('/')
  async deleteRoute(@Body() body: DeleteBody) {
    await this.devService.deleteFile(this.devService.resolvePath(this.dir, body.id))
  }
}
