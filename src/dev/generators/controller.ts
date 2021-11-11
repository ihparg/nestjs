import { join } from 'path'
import { compile } from 'nunjucks'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { Route, Property, Schema } from '../interface'
import { resolvePath } from '../resolvable'
import { DtoGenerator } from './dto'
import { getFileName, toCapital, writeFileFix, getInstanceName } from './utils'
import { resolveService } from './service'

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
  private apiPrefix: string

  constructor(routes: Array<Route>, schemas: Array<Schema>, dir: string, apiPrefix: string) {
    this.routes = routes
    this.services = {}
    this.dtoGenerator = () => new DtoGenerator(schemas, dir)
    this.dir = dir
    this.apiPrefix = apiPrefix
  }

  private resolveService(str: string) {
    const [service, method] = str.split('.')
    const result = {
      name: getInstanceName(service),
      method,
      import: resolvePath[service] ?? './' + getFileName(service, 'service'),
    }

    this.services[service] = result

    return result
  }

  private splitPath({ path, method, module }) {
    const splitedPath = path.replace(/^\/|\/$/g, '').split('/')
    const prefix = path.indexOf(':') >= 0 ? method.toLowerCase() : ''

    const fn = (sp: string[], param: string): string => {
      if (sp.length === 0) return param
      const name = `${sp.pop()}${param}`
      if (name && name.indexOf(':') >= 0) return fn(sp, 'By' + toCapital(name.replace(/:/g, '')))
      // return method.toLowerCase() + toCapital(name)
      return fn(sp, toCapital(name))
    }

    return {
      module,
      controller: splitedPath.shift(),
      pathname: '/' + splitedPath.join('/'),
      functionName: prefix + fn(splitedPath, ''),
    }
  }

  private handleResponseHeader(header: Property) {
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
    const content = compile(njk).render({ className: toCapital(name), name })
    await writeFileFix(path, content)
  }

  async generate(src: Route) {
    const { module, controller } = this.splitPath(src)

    const routes = []
    this.imports = {}
    this.routes.forEach(async (r) => {
      if (r.module !== module || r.path.split('/')[0] !== controller) return

      const sp = this.splitPath(r)
      const dtos = this.dtoGenerator().generate(r, sp, src.id === r.id)
      const route = {
        desc: r.title,
        method: toCapital(r.method.toLowerCase()),
        responseHeader: this.handleResponseHeader(r.responseHeaders),
        service: this.resolveService(r.resolve),
        ...dtos,
        ...sp,
      }
      routes.push(route)
      this.imports[r.method.toLowerCase()] = true
      if (route.BodyDto) this.imports['Body'] = true
      if (route.QueryDto) this.imports['Query'] = true
      if (route.params) this.imports['Param'] = true

      if (r.id === src.id) {
        await resolveService({
          functionName: route.service.method,
          service: r.resolve,
          dtos,
          dir: join(this.dir, module, controller),
          params: route.params,
        })
      }
    })

    const njk = await readFile(join(__dirname, '../tpl/controller.njk'), 'utf-8')
    const options = {
      routes,
      services: this.services,
      controllerPath: (this.apiPrefix || '') + '/' + (module ? module + '/' : '') + controller,
      controllerName: toCapital(controller),
      imports: Object.keys(this.imports)
        .map((m) => toCapital(m))
        .join(','),
    }

    const content = compile(njk).render(options)
    const fileName = getFileName(controller, 'controller')
    // 完整路径
    const path = join(this.dir, module, controller, fileName + '.ts')

    await writeFileFix(path, content)

    this.createModule(join(this.dir, module, controller, getFileName(controller, 'module') + '.ts'), controller)
  }
}