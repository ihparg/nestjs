import { readFile } from 'fs/promises'
import { join } from 'path'
import { compile } from 'nunjucks'
import { Schema, Properties, Property } from '../interface'
import { getField as getFieldInterface } from './interface'
import { toCapital, getFileName, writeFileFix, eslintFix } from './utils'

interface FieldType {
  sqlType: any
  jsType: string
}

export class MongoGenerator {
  private schema: Schema
  private schemas: Array<Schema>
  private path: string
  private name: string
  private className: string
  private relatedModels: { [key: string]: string }

  constructor(schema: Schema, path: string, schemas: Array<Schema>) {
    this.schemas = schemas
    this.name = schema.name
    this.path = path
    this.className = toCapital(schema.name)
    this.schema = schema
  }

  async generate() {
    const njk = await readFile(join(__dirname, './tpl/mongo.njk'), 'utf-8')
    const props = this.schema.content.properties
    const options = {
      name: this.className,
      fields: this.getFields(props),
    }
    const tpl = compile(njk)
    const content = tpl.render(options)
    const path = join(this.path, getFileName(this.name, 'schema') + '.ts')
    await writeFileFix(path, content)
    eslintFix(path)
  }

  getFields(props: Properties) {
    const fields = []
    Object.keys(props).forEach((name) => {
      const p = props[name]
      fields.push(this.getField(p, name))
    })
    fields.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return fields
  }

  private getField(prop: Property, name: string) {
    if (prop.type === 'ref') {
      return this.getRef(prop, name, false)
    } else {
      return {
        ...getFieldInterface(prop, name),
        ...this.getType(prop),
      }
    }
  }

  getRef(prop: Property, name: string, isMany: boolean) {
    const { ref } = prop
    const refClassName = toCapital(ref)
    const target = this.schemas.find((s) => s.name === ref)
    if (!target) throw new Error(`Schema "${ref}" is missing.`)

    // 如果关联的没有标记为数据表，直接返回类型
    if (target.tag !== 'mongodb') {
      return {
        ...getFieldInterface(target.content, name),
        ...this.getType(target.content),
      }
    }

    return {}
  }

  private getType(prop: Property) {
    if (!prop) return undefined
    let type: FieldType
    switch (prop.type) {
      case 'uuid':
        type = { jsType: 'string', sqlType: '{ type: mongoose.Schema.Types.ObjectId }' }
        break
      case 'integer':
        type = { jsType: 'number', sqlType: {} }
        break
      // 不建议使用double和float，使用decimal类型
      case 'double':
      case 'float':
      case 'decimal':
      case 'biginteger':
        type = { jsType: 'number', sqlType: {} }
        break
      case 'text':
        type = { jsType: 'string', sqlType: {} }
        break
      case 'object':
      case 'map':
        type = { jsType: 'Record<string, any>', sqlType: getFieldInterface(prop) }
        break
      case 'array':
        const itemType = this.getType(prop.items[0])
        type = { jsType: itemType.jsType + '[]', sqlType: { type: [itemType.jsType] } }
        break
      case 'json':
        type = { jsType: 'any', sqlType: 'json' }
        break
      default:
        type = { jsType: prop.type, sqlType: {}
    }
    if (typeof type.sqlType !== 'string') {
      type.sqlType = JSON.stringify(type.sqlType)
    }
    return type
  }
}
