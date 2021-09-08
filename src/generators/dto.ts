import { join } from 'path'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { compile } from 'nunjucks'
import { Properties, Property, Route, Schema } from '../interface'
import { flattenSchemas } from './schema'
import { getFileName, toCapital, writeFileFix } from './utils'

interface Field {
  type: string
  desc: string
  required: boolean
}

interface Dto {
  desc: string
  fields?: { [key: string]: Field }
  type?: string
}

interface Option {
  controller: string
  module: string
  functionName: string
}

interface Result {
  BodyDto?: string
  QueryDto?: string
  ResponseDto?: string
  fileName?: string
  imports?: string
  params?: {
    [key: string]: Field
  }
}

export class DtoGenerator {
  private schemas: { [key: string]: Property }
  private tempRootName: string
  private dtos: { [key: string]: Dto }
  private dir: string

  constructor(schemas: Array<Schema>, dir: string) {
    this.schemas = flattenSchemas(schemas)
    this.dir = dir
  }

  getRef(prop: Property) {
    const ref = { ...this.schemas[prop.ref] }
    ;['description', 'reauired', 'items', 'circleRef'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(prop, key)) {
        ref[key] = prop[key]
      }
    })
    ref.properties = {}
    if (prop.properties) {
      Object.keys(prop.properties)
        .filter((p) => !ref.properties[p])
        .forEach((key) => {
          ref.properties[key] = prop.properties[key]
          if (ref.properties[key].ref) {
            ref.properties[key] = this.getRef(ref.properties[key])
          }
        })
    }
    return ref
  }

  getDtoName(prop: Property): string {
    const name =
      this.tempRootName +
      prop.circleRef
        .split('.')
        .filter((s) => s !== '0')
        .map((s) => toCapital(s))
        .join('')

    return prop.type === 'array' ? name + '[]' : name
  }

  convertType(prop: Property, name: string) {
    if (prop.circleRef) {
      return this.getDtoName(prop)
    }

    switch (prop.type) {
      case 'integer':
      case 'biginteger':
      case 'decimal':
      case 'double':
        return 'number'
      case 'string':
      case 'uuid':
      case 'text':
        return 'string'
      case 'datetime':
        return 'Date'
      case 'json':
      case 'blob':
        return 'any'
      case 'object':
        return this.createDto(prop, name)
      case 'array':
        return this.getDefine(prop.items[0], name) + '[]'
      case 'map':
        return '{ [key: string]: string }'
      default:
        throw 'unknow type ' + prop.type
    }
  }

  getFields(props: Properties, path: string) {
    if (!props || Object.keys(props).length === 0) return undefined
    const fields: { [key: string]: Field } = {}
    Object.keys(props).forEach((name) => {
      let p = props[name]
      if (p.ref) p = this.getRef(p)
      const type = this.convertType(p, path + toCapital(name))
      if (!type) return
      fields[name] = {
        required: p.required,
        desc: p.description,
        type,
      }
    })
    return fields
  }

  createDto(prop: Property, name: string) {
    const fields = this.getFields(prop.properties, name)
    if (!fields) return

    this.dtos[name] = {
      desc: prop.description,
      // type: this.convertType(prop, name),
      fields,
    }

    return name
  }

  getDefine(prop: Property, name: string, isRoot?: boolean) {
    if (isRoot) this.tempRootName = name
    if (prop.type === 'ref') prop = this.getRef(prop)
    const type = this.convertType(prop, name)
    return type
  }

  async writeFile(option: Option, overwrite: boolean) {
    const { module, controller, functionName } = option
    const njk = await readFile(join(__dirname, './tpl/dto.njk'), 'utf-8')
    const content = compile(njk).render({ dtos: this.dtos })
    const path = join(this.dir, module, controller, 'dto', getFileName(functionName, 'dto') + '.ts')

    if (overwrite || !existsSync(path)) {
      await writeFileFix(path, content)
    }
  }

  generate(route: Route, option: Option, overwrite: boolean): Result {
    this.dtos = {}
    const results: Result = {}

    const createDto = (prop: Property, name: string) => {
      if (!prop) return
      const type = this.getDefine(prop, toCapital(option.functionName) + name, true)
      if (type) results[name + 'Dto'] = type
    }

    createDto(route.responseBody, 'Response')
    createDto(route.requestBody, 'Body')
    createDto(route.queryString, 'Query')

    this.writeFile(option, overwrite)

    const imps = Object.values(results).filter((s) => !['number', 'string', 'Date', 'any'].includes(s as string))
    results.fileName = `./dto/${getFileName(option.functionName, 'dto')}`
    results.params = this.getFields(route.routeParams.properties, 'Params')

    if (imps.length > 0) {
      results.imports = `import { ${imps.join(',')} } from '${results.fileName}'`
    }

    return results
  }
}
