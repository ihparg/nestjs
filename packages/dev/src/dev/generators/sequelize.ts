import { HttpException, HttpStatus } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { compile } from 'nunjucks'
import { Properties, Property, Schema } from '../interface'
import { getField as getFieldInterface } from './interface'
import { writeFileFix, getFileName, toUnderscore } from './utils'

interface FieldType {
  sqlType: any
  jsType?: string
  objType?: any
  refType?: string
}

export class SequelizeGenerator {
  private relatedTypes: { [key: string]: boolean }
  private relatedEntities: { [key: string]: string }
  private name: string
  private className: string
  private path: string
  private schema: Schema
  private schemas: Array<Schema>
  private underscore: boolean

  constructor(schema: Schema, path: string, schemas: Array<Schema>, underscore: boolean) {
    this.relatedTypes = {}
    this.relatedEntities = {}
    this.name = schema.name
    this.path = path
    this.className = schema.name[0].toUpperCase() + schema.name.slice(1)
    this.schema = schema
    this.schemas = schemas
    this.underscore = underscore
  }

  async generate() {
    const njk = await readFile(join(__dirname, '../tpl/sequelize.njk'), 'utf-8')
    const props = this.schema.content.properties
    const options = {
      name: this.className,
      primaryId: this.getType(props.id, 'id'),
      fields: this.getFields(props),
      relatedTypes: Object.keys(this.relatedTypes).join(','),
      imports: this.getImports(),
      tableName: toUnderscore(this.name),
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
        ...this.getType(prop, name),
      }
    }
  }

  private getFields(props: Properties) {
    const fields = []
    Object.keys(props).forEach((name) => {
      const p = props[name]
      if (name === 'id') return
      const field = this.getField(p, name)
      fields.push(field)
    })
    fields.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return fields
  }

  private stringify(field: { [key: string]: string }) {
    const { type, ...args } = field
    return '{ type: ' + type + ',' + JSON.stringify(args).substr(1)
  }

  private getType(prop: Property, name: string) {
    if (!prop) return undefined
    let type: FieldType
    switch (prop.type) {
      case 'uuid':
        type = { jsType: 'string', sqlType: { type: 'DataType.UUID' } }
        break
      case 'integer':
        type = { jsType: 'number', sqlType: { type: 'DataType.INTEGER' } }
        if (prop.defaultValue) type.sqlType.default = prop.defaultValue
        break
      // 不建议使用double和float，使用decimal类型
      case 'double':
      case 'float':
      case 'decimal':
        type = { jsType: 'number', sqlType: { type: 'DataType.DECIMAL' } }
        if (prop.defaultValue) type.sqlType.default = prop.defaultValue
        break
      case 'datetime':
        type = { jsType: 'Date', sqlType: { type: 'DataType.DATE' } }
        break
      case 'biginteger':
        type = { jsType: 'number', sqlType: { type: 'DataType.BIGINT' } }
        if (prop.defaultValue) type.sqlType.default = prop.defaultValue
        break
      case 'text':
        type = { jsType: 'string', sqlType: { type: 'DataType.TEXT' } }
        if (prop.defaultValue) type.sqlType.default = prop.defaultValue
        break
      case 'object':
      case 'map':
      case 'array':
      case 'json':
        type = { jsType: 'any', sqlType: { type: 'DataType.JSON' } }
        break
      default:
        type = { jsType: prop.type, sqlType: { type: 'DataType.STRING' } }
        if (prop.defaultValue) type.sqlType.default = prop.defaultValue
    }
    if (this.underscore) type.sqlType.field = toUnderscore(name)
    //type.sqlType = JSON.stringify(type.sqlType)
    type.sqlType = this.stringify(type.sqlType)
    return type
  }

  convertFieldName(name: string): string {
    return this.underscore ? toUnderscore(name) : name
  }

  getJoinTable(target: string, inverse: string): string {
    const tableName = [target, inverse]
      .sort((a, b) => a.localeCompare(b))
      .map((s) => this.convertFieldName(s))
      .join('_')

    const targetId = this.convertFieldName(target + 'Id')
    const inverseId = this.convertFieldName(inverse + 'Id')

    return `@JoinTable({ name: '${tableName}', joinColumn: { name: '${inverseId}' }, inverseJoinColumn: { name: '${targetId}' } })`
  }

  private getRef(prop: Property, name: string, isMany: boolean) {
    const { ref } = prop
    const refClassName = ref[0].toUpperCase() + ref.slice(1)
    const target = this.schemas.find((s) => s.name === ref)
    if (!target) throw new HttpException(`Schema "${ref}" is missing.`, HttpStatus.INTERNAL_SERVER_ERROR)
    const relatedField = { name: null, prop: null, isMany: false }

    // 如果关联的没有标记为数据表，直接返回类型
    if (target.tag !== 'sequelize') {
      return {
        ...getFieldInterface(target.content, name),
        ...this.getType(target.content, name),
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
    const refType = ''
    const jsType = isMany ? `${refClassName}[]` : refClassName

    // imports 用
    if (refClassName !== this.className) {
      this.relatedEntities[ref] = refClassName
    }
    const rt = ['HasMany', 'ManyToOne', 'OneToMany', 'OneToOne'].find((s) => refType.indexOf(s) > 0)
    if (rt) this.relatedTypes[rt] = true
    //if (isJoinColumn) this.relatedTypes.JoinColumn = true

    return {
      name,
      jsType,
      refType,
      desc: prop.description,
      required: prop.required,
      //isJoinColumn,
    }
  }
}
