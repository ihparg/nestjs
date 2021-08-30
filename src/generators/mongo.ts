import { readFile } from 'fs/promises'
import { join } from 'path'
import { compile } from 'nunjucks'
import { Schema, Properties, Property } from '../interface'
import { getField as getFieldInterface } from './interface'
import { toCapital, getFileName, writeFileFix } from './utils'

interface FieldType {
  sqlType: any
  jsType: string
}

const interfaceTpl = compile(`{% macro createObject(fields) %} {
  {% for field in fields %}{{createField(field)}}{% endfor %}
}{% endmacro %}
{% macro createField(field) %}
  {% if (field.name) %}{{field.name}}{%if not(field.required)%}?{% endif %}: {% endif %}
  {%- if (field.type === 'object' or field.type === 'map') -%}
    {{createObject(field.fields)}},
  {%- elif (field.type === 'array') -%}
    [{{createField(field.fields[0])}}],
  {%- else -%}
    {{ field.type | capitalize }},
  {%- endif %}
{% endmacro %}
{{createObject(fields)}}`)

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
    this.relatedModels = {}
  }

  async generate() {
    const njk = await readFile(join(__dirname, './tpl/mongo.njk'), 'utf-8')
    const props = this.schema.content.properties
    const options = {
      name: this.className,
      fields: this.getFields(props),
      imports: this.getImports(),
    }
    const tpl = compile(njk)
    const content = tpl.render(options)
    const path = join(this.path, getFileName(this.name, 'schema') + '.ts')
    await writeFileFix(path, content)
  }

  getImports() {
    const imports = []
    Object.keys(this.relatedModels).forEach((k) => {
      const file = getFileName(k, 'schema')
      imports.push(`import { ${this.relatedModels[k]} } from './${file}'`)
    })
    return imports
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
    return {
      ...getFieldInterface(prop, name),
      ...this.getType(prop),
    }
  }

  getRef(prop: Property, name: string): any {
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

    if (refClassName !== this.className) {
      this.relatedModels[ref] = refClassName
    }

    return { jsType: refClassName }
  }

  private getType(prop: Property): FieldType {
    if (!prop) return { jsType: '', sqlType: {} }
    let type: FieldType
    switch (prop.type) {
      case 'uuid':
        type = { jsType: 'string', sqlType: '{ type: mongoose.Schema.Types.ObjectId }' }
        break
      case 'integer':
        type = { jsType: 'number', sqlType: { required: prop.required } }
        break
      // 不建议使用double和float，使用decimal类型
      case 'double':
      case 'float':
      case 'decimal':
      case 'biginteger':
        type = { jsType: 'number', sqlType: { required: prop.required } }
        break
      case 'text':
        type = { jsType: 'string', sqlType: { required: prop.required } }
        break
      case 'object':
      case 'map':
        const fields = getFieldInterface(prop).fields
        console.log(fields)
        type = { jsType: 'Record<string, any>', sqlType: `raw(${interfaceTpl.render({ fields })})` }
        break
      case 'array':
        const itemType = this.getType(prop.items[0])
        type = { jsType: itemType.jsType + '[]', sqlType: `{ type: [${itemType.sqlType}] }` }
        break
      case 'json':
        type = { jsType: 'any', sqlType: {} }
        break
      case 'datetime':
        type = { jsType: 'Date', sqlType: `{ type: Date }` }
        break
      case 'ref':
        const ref = this.getRef(prop, '')
        type = { jsType: ref.jsType, sqlType: `{ type: mongoose.Schema.Types.ObjectId, ref: '${ref.jsType}' }` }
        break
      default:
        type = { jsType: prop.type, sqlType: { required: prop.required } }
    }
    if (typeof type.sqlType !== 'string') {
      type.sqlType = JSON.stringify(type.sqlType)
    }
    return type
  }
}
