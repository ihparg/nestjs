import { Properties, Property, Route, Schema } from '../interface'
import { flattenSchemas } from './schema'
import { toCapital } from './utils'

export const getDtoName = (): string => {
  return ''
}

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

export class DtoGenerator {
  private schemas: { [key: string]: Property }
  // 临时存储引用，处理循环引用
  private tempRefs: { [key: string]: string }
  private tempName: string
  private dtos: { [key: string]: Dto }

  constructor(schemas: Array<Schema>) {
    this.schemas = flattenSchemas(schemas)
  }

  getRef(prop: Property) {
    const ref = { ...this.schemas[prop.ref] }
    ;['description', 'reauired'].forEach((key) => {
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
        })
    }
    return ref
  }

  convertType(prop: Property, name: string) {
    switch (prop.type) {
      case 'integer':
      case 'biginteger':
      case 'decimal':
      case 'double':
        return '"number"'
      case 'string':
      case 'uuid':
      case 'text':
        return '"string"'
      case 'datetime':
        return '"Date"'
      case 'json':
      case 'blob':
        return '"any"'
      case 'object':
        this.createDto(prop, name)
        return name
      case 'array':
        return '[]'
      case 'map':
        return '{ [key: string]: string }'
      default:
        console.log(prop)
        throw 'unknow type ' + prop.type
    }
  }

  getFields(props: Properties, path: string) {
    if (!props || Object.keys(props).length === 0) return undefined
    const fields: { [key: string]: Field } = {}
    Object.keys(props).forEach((name) => {
      let p = props[name]
      if (p.ref) p = this.getRef(p)
      fields[name] = {
        required: p.required,
        desc: p.description,
        type: this.convertType(p, path + toCapital(name)),
      }
    })
    return fields
  }

  createDto(prop: Property, name: string) {
    this.dtos[name] = {
      desc: prop.description,
      // type: this.convertType(prop, name),
      fields: this.getFields(prop.properties, name),
    }
  }

  getDefine(prop: Property, name: string) {
    this.tempName = name
    if (prop.type === 'ref') prop = this.getRef(prop)
    const type = this.convertType(prop, toCapital(name))
    return type
  }

  generate(route: Route): { [key: string]: string } {
    // 重置引用
    this.tempRefs = {}
    this.dtos = {}
    const results = {
      responseDto: this.getDefine(route.responseBody, 'response'),
    }
    console.log(JSON.stringify(this.dtos, null, 2))
    console.log(results)
    return results
  }
}
