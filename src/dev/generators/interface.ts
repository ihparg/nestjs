import { readFile } from 'fs/promises'
import { join } from 'path'
import { compile } from 'nunjucks'
import { Schema, Properties, Property } from '../interface'
import { writeFileFix } from './utils'

interface Field {
  name: string
  required: boolean
  desc: string
  fields?: Array<Field>
  type: string
}

const getInterfaceName = (name): string => {
  return name[0].toUpperCase() + name.slice(1)
}

const convertType = (props: Property): string => {
  if (props.enum) {
    return props.enum.map((e) => (props.type === 'string' ? '"' + e.value + '"' : e.value)).join('|')
  }
  switch (props.type) {
    case 'integer':
    case 'biginteger':
    case 'decimal':
    case 'double':
      return 'number'
    case 'ref':
      return getInterfaceName(props.ref)
    case 'uuid':
    case 'text':
      return 'string'
    case 'datetime':
      return 'Date'
    case 'json':
      return 'any'
    case 'blob':
      return 'Blob'
    default:
      return props.type
  }
}

export const getField = (prop: Property, name?: string): Field => {
  const field: Field = {
    name,
    required: prop.required,
    desc: prop.description,
    type: convertType(prop),
  }

  if (prop.properties && Object.keys(prop.properties).length > 0) {
    field.fields = getFields(prop.properties)
  }

  if (prop.items) {
    field.fields = prop.items.map((i) => getField(i))
  }

  if (prop.type === 'map') {
    prop.items[0].required = true
    field.fields = [getField(prop.items[0], '[key: string]')]
  }

  return field
}

const getFields = (props: Properties): Array<Field> => {
  const fields = []
  Object.keys(props).forEach((name: string) => {
    fields.push(getField(props[name], name))
  })
  fields.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  return fields
}

export const generateInterface = async (schemas: Array<Schema>, filePath: string) => {
  const njk = await readFile(join(__dirname, '../tpl/interface.njk'), 'utf-8')
  const tpl = compile(njk)
  const list = schemas.map((schema: Schema) => {
    schema.iname = getInterfaceName(schema.name)
    return {
      iname: getInterfaceName(schema.name),
      desc: schema.description,
      fields: getFields(schema.content.properties),
    }
  })
  const content = tpl.render({ schemas: list })
  await writeFileFix(filePath, content)
}
