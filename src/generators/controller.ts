import { join } from 'path'
import { compile } from 'nunjucks'
import { readFile } from 'fs/promises'
import { IRoute, IProperty, ISchema } from '../interface'
import { resolvePath } from '../resolvable'
import { DtoGenerator } from './dto'
import {
  eslintFix,
  getFileName,
  toCapital,
  writeFileFix,
  getInstanceName,
} from './utils'

export class ControllerGenerator {
  private routes: Array<IRoute>
  private services: {
    [key: string]: {
      name: string
      method: string
      import: string
    }
  }
  private imports: { [key: string]: boolean }
  private dtoGenerator: DtoGenerator

  constructor(routes: Array<IRoute>, schemas: Array<ISchema>) {
    this.routes = routes
    this.services = {}
    this.dtoGenerator = new DtoGenerator(schemas)
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

  private handleResponseHeader(header: IProperty) {
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

  async generate(route: IRoute, dir: string) {
    const { module, controller } = this.splitPath(route)

    const routes = []
    this.imports = {}
    this.routes.forEach((r) => {
      if (r.module !== module || r.path.split('/')[1] !== controller) return

      routes.push({
        desc: r.description,
        method: toCapital(r.method),
        responseDto: {},
        bodyDto: {},
        queryDto: {},
        paramsDto: {},
        responseHeader: this.handleResponseHeader(r.responseHeaders),
        requestHeaderDto: {},
        service: this.resolveService(r.resolve),
        ...this.dtoGenerator.generate(r),
        ...this.splitPath(r),
      })
      this.imports[r.method] = true
    })

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
    dir = join(dir, module, controller, fileName + '.ts')

    await writeFileFix(dir, content)
    eslintFix(dir)
  }
}
