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
  validator: string[]
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
  params?: Record<string, Field>
  dtos?: Record<string, Dto>
  ignoreValidator?: boolean
}

export class DtoGenerator {
  private schemas: { [key: string]: Property }
  private tempRootName: string
  private dtos: Record<string, Dto>
  private types: Record<string, string>
  private usedValidators: { [key: string]: boolean }
  private useTransform = false
  private dir: string

  constructor(schemas: Array<Schema>, dir: string) {
    this.schemas = flattenSchemas(schemas)
    this.dir = dir
  }

  getRef(prop: Property) {
    const ref = { ...this.schemas[prop.ref] }
    ;['description', 'required', 'items', 'circleRef'].forEach((key) => {
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
            ref.properties[key] = this.getRef(prop.properties[key])
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
    if (prop.enum) {
      return prop.enum.map((e) => (prop.type === 'string' ? '"' + e.value + '"' : e.value)).join('|')
    }

    switch (prop.type) {
      case 'integer':
      case 'decimal':
      case 'double':
        return 'number'
      case 'biginteger':
        return 'string'
      case 'string':
      case 'uuid':
      case 'text':
        return 'string'
      case 'datetime':
        return 'Date'
      case 'boolean':
        return 'boolean'
      case 'json':
      case 'blob':
        return 'any'
      case 'object':
        return this.createDto(prop, name)
      case 'array':
        return this.getDefine(prop.items[0], name) + '[]'
      case 'map':
        return `Map<string, ${this.getDefine(prop.items[0], name)}>`
      default:
        console.error('unknow type ' + prop.type, name)
        return 'undefined'
      // throw 'unknow type ' + prop.type
    }
  }

  getArrayValidatorType(prop: Property, name: string): string {
    switch (prop.type) {
      case 'integer':
      case 'decimal':
      case 'double':
        return 'Type(() => Number)'
      case 'biginteger':
      case 'string':
      case 'uuid':
      case 'text':
        return 'Type(() => String)'
      case 'datetime':
        return 'Type(() => Date)'
      case 'boolean':
        return 'Type(() => Boolean)'
      case 'array':
        return this.getArrayValidatorType(prop.items[0], name)
      case 'json':
        return ''
      case 'map':
        return `Type(() => Object)`
      case 'ref':
        return this.getArrayValidatorType(this.getRef(prop), name)
      default:
        return `Type(() => ${name.replace('[]', '')})`
    }
  }

  getValidator(prop: Property, name: string): string[] {
    const result = []

    const setResult = (k: string, f: string) => {
      if (prop[k]) result.push(`${f}(${prop[k]})`)
    }

    if (prop.circleRef) {
      name = this.getDtoName(prop)
    }

    const setType = () => {
      switch (prop.type) {
        case 'integer':
        case 'decimal':
        case 'double':
          result.push('IsNumber()')
          result.push('Type(() => Number)')
          break
        case 'biginteger':
          result.push('IsNumberString()')
          result.push('Type(() => String)')
          break
        case 'string':
        case 'uuid':
        case 'text':
          result.push('IsString()')
          result.push('Type(() => String)')
          break
        case 'datetime':
          result.push('IsDate()')
          result.push('Type(() => Date)')
          break
        case 'boolean':
          result.push('IsBoolean()')
          result.push(`Transform(({ value }) => value === 'false' ? false : !! value)`)
          break
        case 'array':
          result.push('IsArray()')
          const r = this.getArrayValidatorType(prop.items[0], name)
          if (r) result.push(r)
          break
        case 'json':
          break
        case 'map':
          result.push(`Type(() => Object)`)
          break
        case 'blob':
          break
        default:
          result.push(`Type(() => ${name})`)
          result.push('ValidateNested()')
      }
    }

    if (!prop.required) result.push('IsOptional()')
    setResult('minLength', 'MinLength')
    setResult('maxLength', 'MaxLength')
    setResult('minimum', 'Min')
    setResult('maximum', 'Max')
    setType()
    if (prop.enum) {
      result.push(`IsIn([${prop.enum.map((e) => (prop.type === 'string' ? '"' + e.value + '"' : e.value)).join(',')}])`)
    }

    result.forEach((r) => {
      const k = r.replace(/\(.*/g, '')
      if (k !== 'Type' && k !== 'Transform') this.usedValidators[k] = true
      if (k === 'Transform') this.useTransform = true
    })

    return Array.from(new Set(result))
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
        validator: this.getValidator(p, path + toCapital(name)),
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
    const njk = await readFile(join(__dirname, '../tpl/dto.njk'), 'utf-8')
    const content = compile(njk).render({
      dtos: this.dtos,
      types: this.types,
      validators: Object.keys(this.usedValidators).join(','),
      hasTransform: this.useTransform,
    })
    const path = join(this.dir, module, controller, 'dto', getFileName(functionName, 'dto') + '.ts')

    if (overwrite || !existsSync(path)) {
      await writeFileFix(path, content)
    }
  }

  generate(route: Route, option: Option, overwrite: boolean): Result {
    this.dtos = {}
    this.types = {}
    this.usedValidators = {}
    this.useTransform = false
    const results: Result = {}

    const createDto = (prop: Property, name: string) => {
      if (!prop) return
      const typeName = toCapital(option.functionName) + name
      const type = this.getDefine(prop, typeName, true)
      if (type) {
        if (type.indexOf(name) >= 0) {
          results[name + 'Dto'] = type
        } else {
          console.log('type', typeName, type)
          this.types[typeName] = type
          results[name + 'Dto'] = typeName
        }
      }
    }

    createDto(route.responseBody, 'Response')
    createDto(route.requestBody, 'Body')
    createDto(route.queryString, 'Query')

    this.writeFile(option, overwrite)

    const imps = Object.values(results)
      .filter((s) => !['number', 'string', 'Date', 'any'].includes(s as string))
      .map((s) => s.replace('[]', ''))
    results.fileName = `./dto/${getFileName(option.functionName, 'dto')}`
    results.params = this.getFields(route.routeParams.properties, 'Params')

    if (imps.length > 0) {
      results.imports = `import { ${imps.join(', ')} } from '${results.fileName}'`
    }

    results.dtos = this.dtos
    results.ignoreValidator = !!this.types[toCapital(option.functionName) + 'Response']

    return results
  }
}
