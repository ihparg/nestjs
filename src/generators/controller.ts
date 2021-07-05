import { join } from 'path'
import { compile } from 'nunjucks'
import { readFile } from 'fs/promises'
import { IRoute } from '../interface'
import {
  eslintFix,
  getFileName,
  toCamelCase,
  toCapital,
  writeFileFix,
  getInstanceName,
} from './utils'

export class ControllerGenerator {
  private tag: string
  private routes: Array<IRoute>
  private services: { [key: string]: string }
  private imports: { [key: string]: boolean }

  constructor(routes: Array<IRoute>, tag: string) {
    this.routes = routes.filter((r) => r.tag === tag)
    this.tag = tag
    this.services = {}
  }

  private resolveService(str: string) {
    const [service, method] = str.split('.')
    this.services[service] = getInstanceName(service)
    return { service: getInstanceName(service), method }
  }

  async generate(path: string) {
    const routes = []
    this.imports = {}
    this.routes.forEach((r) => {
      routes.push({
        functionName: r.functionName,
        desc: r.description,
        method: r.method,
        responseDto: {},
        bodyDto: {},
        queryDto: {},
        paramsDto: {},
        responseHeader: {},
        requestHeaderDto: {},
        service: this.resolveService(r.resolve),
      })
      this.imports[r.method] = true
    })

    const njk = await readFile(join(__dirname, './tpl/controller.njk'), 'utf-8')
    const options = {
      routes,
      services: this.services,
      tag: this.tag,
      controllerName: toCapital(toCamelCase(this.tag.replace(/\//g, '_'))),
      imports: Object.keys(this.imports)
        .map((m) => toCamelCase(m))
        .join(','),
    }

    const content = compile(njk).render(options)

    const lastIndex = this.tag.lastIndexOf('/') + 1
    const fileName = getFileName(this.tag.slice(lastIndex), 'controller')
    // 完整路径
    path = join(compile(path).render({ tag: this.tag }), fileName + '.ts')

    console.log('path', path)

    await writeFileFix(path, content)
    eslintFix(path)
  }
}
