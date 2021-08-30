import { readFile } from 'fs/promises'
import { join } from 'path'
import { compile } from 'nunjucks'
import { Properties, Property, Schema } from '../interface'
import { getField as getFieldInterface } from './interface'
import { writeFileFix, getFileName } from './utils'

interface FieldType {
  sqlType: any
  jsType?: string
  objType?: any
  refType?: string
}

const isERModel = (type) => ['mysql', 'postgres', 'sqlite', 'typeorm'].includes(type)

export class TypeOrmGenerator {
  private relatedTypes: { [key: string]: boolean }
  private relatedEntities: { [key: string]: string }
  private name: string
  private className: string
  private path: string
  private schema: Schema
  private schemas: Array<Schema>

  constructor(schema: Schema, path: string, schemas: Array<Schema>) {
    this.relatedTypes = {}
    this.relatedEntities = {}
    this.name = schema.name
    this.path = path
    this.className = schema.name[0].toUpperCase() + schema.name.slice(1)
    this.schema = schema
    this.schemas = schemas
  }

  async generate() {
    const njk = await readFile(join(__dirname, './tpl/typeorm.njk'), 'utf-8')
    const props = this.schema.content.properties
    const options = {
      name: this.className,
      primaryId: this.getType(props.id),
      fields: this.getFields(props),
      relatedTypes: Object.keys(this.relatedTypes).join(','),
      imports: this.getImports(),
      tableName:
        this.name[0].toLowerCase() +
        this.name
          .slice(1)
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase(),
    }
    const tpl = compile(njk)
    const content = tpl.render(options)
    const path = join(this.path, getFileName(this.name, 'entity') + '.ts')
    await writeFileFix(path, content)
  }

  getImports() {
    const imports = []
    Object.keys(this.relatedEntities).forEach((k) => {
      const file = getFileName(k, 'entity')
      imports.push(`import { ${this.relatedEntities[k]} } from './${file}'`)
    })
    return imports
  }

  private getField(prop: Property, name: string) {
    if (prop.type === 'ref') {
      return this.getRef(prop, name, false)
    } else if (prop.type === 'array' && prop.items[0].type === 'ref') {
      return this.getRef(prop.items[0], name, true)
    } else {
      return {
        ...getFieldInterface(prop, name),
        ...this.getType(prop),
      }
    }
  }

  private getFields(props: Properties) {
    const fields = []
    Object.keys(props).forEach((name) => {
      const p = props[name]
      if (name === 'id') return
      fields.push(this.getField(p, name))
    })
    fields.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return fields
  }

  private getType(prop: Property) {
    if (!prop) return undefined
    let type: FieldType
    switch (prop.type) {
      case 'uuid':
        type = { jsType: 'string', sqlType: 'uuid' }
        break
      case 'integer':
        type = { jsType: 'number', sqlType: { type: 'int' } }
        break
      // 不建议使用double和float，使用decimal类型
      case 'double':
      case 'float':
      case 'decimal':
        type = { jsType: 'number', sqlType: { type: 'decimal' } }
        break
      case 'biginteger':
        type = { jsType: 'number', sqlType: { type: 'bigint' } }
        break
      case 'text':
        type = { jsType: 'string', sqlType: { type: 'text' } }
        break
      case 'object':
      case 'map':
      case 'array':
        type = { sqlType: { type: 'simple-json' } }
        break
      case 'json':
        type = { jsType: 'any', sqlType: 'json' }
        break
      default:
        type = { jsType: prop.type, sqlType: prop.type }
    }
    type.sqlType = JSON.stringify(type.sqlType)
    return type
  }

  private getRef(prop: Property, name: string, isMany: boolean) {
    const { ref } = prop
    const refClassName = ref[0].toUpperCase() + ref.slice(1)
    const target = this.schemas.find((s) => s.name === ref)
    if (!target) throw new Error(`Schema "${ref}" is missing.`)
    const relatedField = { name: null, prop: null, isMany: false }

    // 如果关联的没有标记为数据表，直接返回类型
    if (!isERModel(target.tag)) {
      return {
        ...getFieldInterface(target.content, name),
        ...this.getType(target.content),
      }
    }

    Object.keys(target.content.properties).forEach((key) => {
      const p = target.content.properties[key]
      if (p.ref === this.name) {
        relatedField.name = key
        relatedField.prop = p
      } else if (p.type === 'array' && p.items[0].ref === this.name) {
        relatedField.name = key
        relatedField.prop = p.items[0]
        relatedField.isMany = true
      }
    })
    let refType = ''
    let isJoinColumn = false
    if (relatedField.name) {
      if (isMany) {
        refType = relatedField.isMany
          ? `@ManyToMany(() => ${refClassName})`
          : `@OneToMany(() => ${refClassName}, (e) => e.${relatedField.name})`
      } else {
        refType = `@ManyToOne(() => ${refClassName}, (e) => e.${relatedField.name})`
      }
    } else {
      if (isMany) throw new Error(`没有找到 ${ref}.${name} 的引用`)
      refType = `@OneToOne(() => ${refClassName})`
      isJoinColumn = true
    }
    const jsType = isMany ? `${refClassName}[]` : refClassName

    // imports 用
    if (refClassName !== this.className) {
      this.relatedEntities[ref] = refClassName
    }
    const rt = ['ManyToMany', 'ManyToOne', 'OneToMany', 'OneToOne'].find((s) => refType.indexOf(s) > 0)
    if (rt) this.relatedTypes[rt] = true

    return {
      name,
      jsType,
      refType,
      desc: prop.description,
      required: prop.required,
      isJoinColumn,
    }
  }
}
