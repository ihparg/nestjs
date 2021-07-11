import { join } from 'path'
import { compile } from 'nunjucks'
import { readFile } from 'fs/promises'
import { Route, Property, Schema } from '../interface'
import { resolvePath } from '../resolvable'
import { DtoGenerator } from './dto'
import { eslintFix, getFileName, toCapital, writeFileFix, getInstanceName } from './utils'

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
  private dtoGenerator: DtoGenerator
  private dir: string

  constructor(routes: Array<Route>, schemas: Array<Schema>, dir: string) {
    this.routes = routes
    this.services = {}
    this.dtoGenerator = new DtoGenerator(schemas, dir)
    this.dir = dir
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
    return {
      module,
      controller: splitedPath.shift(),
      pathname: '/' + splitedPath.join('/'),
      functionName: splitedPath.pop() || method?.toLowerCase(),
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

  async generate(route: Route) {
    const { module, controller } = this.splitPath(route)

    const routes = []
    this.imports = {}
    this.routes.forEach((r) => {
      if (r.module !== module || r.path.split('/')[0] !== controller) return

      const sp = this.splitPath(r)
      routes.push({
        desc: r.title,
        method: toCapital(r.method.toLowerCase()),
        responseHeader: this.handleResponseHeader(r.responseHeaders),
        service: this.resolveService(r.resolve),
        ...this.dtoGenerator.generate(r, sp),
        ...sp,
      })
      this.imports[r.method.toLowerCase()] = true
    })

    console.log(routes)

    const njk = await readFile(join(__dirname, './tpl/controller.njk'), 'utf-8')
    const options = {
      routes,
      services: this.services,
      controllerPath: '/' + (module ? module + '/' : '') + controller,
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
    eslintFix(path)
  }
}
