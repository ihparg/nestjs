import { Schema } from '../interface'

const flatten = (schemas: any, path = '', res = {}) => {
  Object.keys(schemas).forEach((k) => {
    const p = `${path}${k}`
    res[p] = { ...schemas[k] }

    if (schemas[k].properties) {
      flatten(schemas[k].properties, `${p}.`, res)
    }
    if (schemas[k].items) {
      flatten(schemas[k].items, `${p}.`, res)
    }
  })
  return res
}

export const flattenSchemas = (schemas: Array<Schema>) => {
  const obj = schemas.reduce((prev, schema) => {
    prev[schema.name] = schema.content
    return prev
  }, {})
  return flatten(obj)
}
