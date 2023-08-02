import { join } from 'path'
import { compile } from 'nunjucks'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { Route, Property, Schema, DevOption } from '../interface'
import { resolvePath } from '../resolvable'
import { DtoGenerator } from './dto'
import { getFileName, toCapital, writeFileFix, getInstanceName } from './utils'
import { resolveService } from './service'
import { RouteResult } from './interface'
import createWebApi from './webapi'
import { getFullPath } from '../utils'

export class ControllerGenerator {
  private routes: Array<Route>
  private services: {
    [key: string]: {
      name: string
      method: string
      import: string
    }
  }
  private imports: { [key: string]: boolean }
  private dtoGenerator: { (): DtoGenerator }
  private dir: string

  constructor(routes: Array<Route>, schemas: Array<Schema>, dir: string, private readonly option: DevOption) {
    this.routes = routes
    this.services = {}
    this.dtoGenerator = () => new DtoGenerator(schemas, dir)
    this.dir = dir
  }

  private resolveService(str: string, controller: string) {
    let [service, method] = str.split('.')
    if (!method) {
      method = service
      service = toCapital(controller) + 'Service'
    }
    const result = {
      name: getInstanceName(service),
      method,
      import: resolvePath[service] ?? './' + getFileName(service, 'service'),
    }

    this.services[service] = result

    return result
  }

  private splitPath({ path, method, module, controller }: Route) {
    const splitedPath = path.replace(/^\/|\/$/g, '').split('/')
    const prefix = path.indexOf(':') >= 0 ? method.toLowerCase() : ''

    const fn = (sp: string[], param: string): string => {
      if (sp.length === 0) return param
      const name = `${sp.pop()}${param}`
      if (name && name.indexOf(':') >= 0) return fn(sp, 'By' + toCapital(name.replace(/:/g, '')))
      return fn(sp, toCapital(name, true))
    }

    return {
      module,
      controller,
      pathname: '/' + splitedPath.join('/'),
      functionName: prefix + fn(splitedPath, ''),
    }
  }

  private handleResponseHeader(header: Property): Record<string, any> {
    if (!header || !header.properties) return null
    const obj = {}
    Object.keys(header.properties).forEach((key) => {
      const value = header.properties[key].defaultValue
      if (value) {
        obj[key] = value
      }
      this.imports.Header = true
    })
    return obj
  }

  async createModule(path, name) {
    if (existsSync(path)) return
    const njk = await readFile(join(__dirname, '../tpl/module.njk'), 'utf-8')
    const content = compile(njk).render({ className: toCapital(name), name: getFileName(name) })
    await writeFileFix(path, content)
  }

  private async createFile(route: any, controller: string, file: string) {
    const { module } = route
    const njk = await readFile(join(__dirname, '../tpl/controller.njk'), 'utf-8')
    const options = {
      route,
      services: this.services,
      controllerPath: (this.option.apiPrefix || '') + '/' + (module ? module + '/' : '') + controller,
      controllerName: toCapital(controller),
      imports: Object.keys(this.imports)
        .map((m) => toCapital(m))
        .join(','),
    }

    const content = compile(njk).render(options)

    await writeFileFix(file, content)
  }

  private getCommonImports(raw: string) {
    const match = /{(.*)}/.exec(raw)
    if (match == null) return raw
    const imports = Object.keys(this.imports)
      .map((s) => toCapital(s))
      .concat(match[1].split(',').map((s) => toCapital(s.trim())))
    return `import { ${Array.from(new Set(imports)).sort().join(', ')} } from '@nestjs/common'`
  }

  private async appendToFile(route: any, controller: string, file: string) {
    const content = await readFile(file, 'utf-8')
    const lines = []
    let stage = 0
    const list = content.replace(/[\s|\n]+$/g, '').split('\n')
    list.forEach((line, i) => {
      if (line.indexOf("from '@nestjs/common'") > 0 && stage === 0) {
        line = this.getCommonImports(line)
      }
      lines.push(line)
      if (line.indexOf('} from ') < 0 && stage === 0) {
        if (route.imports && content.indexOf(route.dtoFileName) < 0) {
          lines.splice(lines.length - 1, 0, route.imports)
        }
        stage = 1
      } else if (line.indexOf(`class ${toCapital(controller)}Controller`) >= 0 && stage === 1) {
        stage = 2
      } else if (stage === 2 && line.indexOf(`async ${route.functionName}`) >= 0) {
        stage = 3
      } else if (stage === 2 && i === list.length - 1) {
        lines.splice(lines.length - 1, 0, route.methodContent)
        stage = 4
      }
    })

    if (stage === 4) await writeFileFix(file, lines.join('\n'))
  }

  private async getMethodContent(route: any): Promise<string> {
    const njk = await readFile(join(__dirname, '../tpl/method.njk'), 'utf-8')
    return compile(njk).render({ route })
  }

  async generate(src: Route, webApiPath: string | string[]) {
    const { module, controller } = this.splitPath(src)

    this.imports = {}

    const sp = this.splitPath(src)
    const dtos = this.dtoGenerator().generate(src, sp, true)
    const route: RouteResult = {
      methodContent: undefined,
      desc: src.title,
      method: toCapital(src.method.toLowerCase(), true),
      responseHeader: this.handleResponseHeader(src.responseHeaders),
      service: this.resolveService(src.resolve, controller),
      fullPath: getFullPath(src, this.option.apiPrefix),
      ...dtos,
      ...sp,
    }
    this.imports[src.method.toLowerCase()] = true
    if (route.BodyDto) this.imports['Body'] = true
    if (route.QueryDto) this.imports['Query'] = true
    if (route.params) this.imports['Param'] = true

    await resolveService({
      controller,
      functionName: route.service.method,
      service: src.resolve,
      dtos,
      dir: join(this.dir, module, controller),
      params: route.params,
    })

    route.methodContent = await this.getMethodContent(route)

    const fileName = getFileName(controller, 'controller')
    // 完整路径
    const file = join(this.dir, module, controller, fileName + '.ts')

    if (existsSync(file)) {
      await this.appendToFile(route, controller, file)
    } else {
      await this.createFile(route, controller, file)
    }

    this.createModule(join(this.dir, module, controller, getFileName(controller, 'module') + '.ts'), controller)

    if (webApiPath) {
      if (typeof webApiPath === 'string') webApiPath = [webApiPath]
      for await (const p of webApiPath) {
        await createWebApi(
          route,
          join(p, module, controller, getFileName(route.functionName) + '.ts'),
          this.option.webApiFetchPath ?? '@/utils/fetch',
          this.option.webApiHost ?? '',
        )
      }
    }
  }
}
