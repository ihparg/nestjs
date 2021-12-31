import { Body, Controller, Delete, Get, Inject, Post } from '@nestjs/common'
import { DEV_OPTION } from './constants'
import { DevService } from './dev.service'
import { ControllerGenerator } from './generators/controller'
import { Route, DeleteBody, DevOption } from './interface'

const getFullPath = (route: Route): string => {
  const path = [route.method]
  if (route.module) path.push(route.module)
  path.push(route.controller)
  path.push(route.path)
  return path.join('/')
}

@Controller('dev/route')
export class RouteController {
  constructor(private readonly devService: DevService, @Inject(DEV_OPTION) private readonly option: DevOption) {}

  get dir(): string {
    return this.option.routePath || 'data/routes'
  }

  @Get('/')
  getList(): Promise<Array<Route>> {
    return this.devService.getJsonFileList(this.dir)
  }

  @Get('/config')
  getConfig() {
    return { prefix: this.option.apiPrefix }
  }

  @Post('/save')
  async saveRoute(@Body() body: Route): Promise<Route> {
    if (!body.id) body.id = this.devService.nextUid()

    let routes = await this.getList()
    const fullPath = getFullPath(body)
    routes.forEach((route) => {
      if (fullPath === getFullPath(route) && body.id !== route.id) {
        throw new Error('路径已经存在')
      }
    })

    await this.devService.saveFile(this.devService.resolvePath(this.dir, body.id), body)

    const { modulePath, schemaPath, webApiPath } = this.option
    if (modulePath) {
      routes = await this.getList()
      const schemas = await this.devService.getJsonFileList(schemaPath || 'data/schemas')
      const cg = new ControllerGenerator(routes, schemas, modulePath, this.option.apiPrefix)
      await cg.generate(body, webApiPath)
    }

    return body
  }

  @Delete('/')
  async deleteRoute(@Body() body: DeleteBody) {
    await this.devService.deleteFile(this.devService.resolvePath(this.dir, body.id))
  }
}
