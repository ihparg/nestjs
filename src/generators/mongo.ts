import { readFile } from 'fs/promises'
import { join } from 'path'
import { compile } from 'nunjucks'
import { Schema, Properties, Property } from '../interface'
import { getField as getFieldInterface } from './interface'
import { toCapital } from './utils'

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
    const njk = await readFile(join(__dirname, './tpl/typeorm.njk'), 'utf-8')
    const props = this.schema.content.properties
    const options = {
      name: this.className,
      fields: this.getFields(props),
    }
    const tpl = compile(njk)
    const content = tpl.render(options)
    console.log(content)
  }

  getFields(props: Properties) {
    const fields = []
    Object.keys(props).forEach((name) => {
      const p = props[name]
      if (name === 'id') return
      fields.push(this.getField(p, name))
    })
    fields.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return fields
  }

  getField(prop: Property, name: string) {
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

  getRef(prop: Property, name: string, isMany: boolean) {
    const { ref } = prop
    const refClassName = toCapital(ref)
    const target = this.schemas.find((s) => s.name === ref)
    if (!target) throw new Error(`Schema "${ref}" is missing.`)
  }

  getType(prop: Property) {}
}
