import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { compile } from 'nunjucks'
import { ISchema, IProperties, IProperty } from './interface'

interface IField {
  name: string
  required: boolean
  desc: string
  fields?: Array<IField>
  type: string
}

const getInterfaceName = (name): string => {
  return 'I' + name[0].toUpperCase() + name.slice(1)
}

const convertType = (props: IProperty): string => {
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

export const getField = (prop: IProperty, name?: string): IField => {
  const field: IField = {
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

const getFields = (props: IProperties): Array<IField> => {
  const fields = []
  Object.keys(props).forEach((name: string) => {
    fields.push(getField(props[name], name))
  })
  fields.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  return fields
}

export const generateInterface = async (
  schemas: Array<ISchema>,
  filePath: string,
) => {
  const njk = await readFile(join(__dirname, './tpl/interface.njk'), 'utf-8')
  const tpl = compile(njk)
  const list = schemas.map((schema: ISchema) => {
    schema.iname = getInterfaceName(schema.name)
    return {
      iname: getInterfaceName(schema.name),
      desc: schema.description,
      fields: getFields(schema.content.properties),
    }
  })
  const content = tpl.render({ schemas: list })
  await writeFile(filePath, content)
}
