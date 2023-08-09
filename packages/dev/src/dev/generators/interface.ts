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

const convertType = (props: Property, innerRef?: Record<string, boolean>): string => {
  if (props.enum) {
    return props.enum.map((e) => (props.type === 'string' ? '"' + e.value + '"' : e.value)).join('|')
  }
  switch (props.type) {
    case 'integer':
    case 'decimal':
    case 'double':
      return 'number'
    case 'biginteger':
      return 'string'
    case 'ref':
      const refType = getInterfaceName(props.ref)
      if (innerRef) innerRef[refType] = true
      return refType
    case 'uuid':
    case 'text':
      return 'string'
    case 'datetime':
    case 'timestamp':
      return 'Date'
    case 'json':
      return 'any'
    case 'blob':
      return 'Blob'
    default:
      return props.type
  }
}

export const getField = (prop: Property, name?: string, innerRef?: Record<string, boolean>): Field => {
  const field: Field = {
    name,
    required: prop.required,
    desc: prop.description,
    type: convertType(prop, innerRef),
  }

  if (prop.properties && Object.keys(prop.properties).length > 0) {
    field.fields = getFields(prop.properties, innerRef)
  }

  if (prop.items) {
    field.fields = prop.items.map((i) => getField(i, undefined, innerRef))
  }

  if (prop.type === 'map') {
    prop.items[0].required = true
    field.fields = [getField(prop.items[0], '[key: string]', innerRef)]
  }

  return field
}

const getFields = (props: Properties, innerRef?: Record<string, boolean>): Array<Field> => {
  const fields = []
  Object.keys(props).forEach((name: string) => {
    fields.push(getField(props[name], name, innerRef))
  })
  fields.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  return fields
}

export const generateInterface = async (schemas: Array<Schema>, filePath: string) => {
  const njk = await readFile(join(__dirname, '../tpl/interface.njk'), 'utf-8')
  const tpl = compile(njk)
  const list = []
  const types = []
  schemas.forEach((schema: Schema) => {
    schema.iname = getInterfaceName(schema.name)
    if (schema.content.properties) {
      list.push({
        iname: getInterfaceName(schema.name),
        desc: schema.description,
        fields: getFields(schema.content.properties),
      })
    } else {
      types.push({
        iname: getInterfaceName(schema.name),
        desc: schema.description,
        field: getField(schema.content),
      })
    }
  })
  const content = tpl.render({ schemas: list, types })
  await writeFileFix(filePath, content)
}

export interface RouteResult {
  methodContent: string
  desc: string
  method: string
  responseHeader: Record<string, any>
  service: {
    name: string
    method: string
    import: string
  }
  module: string
  controller: string
  pathname: string
  fullPath: string
  functionName: string
  BodyDto?: string
  QueryDto?: string
  ResponseDto?: string
  params?: Record<string, any>
  dtos?: Record<string, any>
}
