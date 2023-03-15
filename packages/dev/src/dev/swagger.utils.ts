import { OpenAPIV3 } from 'openapi-types'
import { flattenSchemas } from './generators/schema'
import { Properties, Property, Route, Schema } from './interface'
import { getFullPath } from './utils'

export class Swagger {
  private schemas: { [key: string]: Property }
  private components: OpenAPIV3.ComponentsObject = {}
  private paths: OpenAPIV3.PathsObject = {}

  constructor(schemas: Schema[], private readonly routes: Route[], private readonly apiPrefix: string) {
    this.schemas = flattenSchemas(schemas)
  }

  private getPath(route: Route) {
    return getFullPath(route, this.apiPrefix)
  }

  getRef(prop: Property) {
    const ref = { ...this.schemas[prop.ref] }
    ;['description', 'required', 'items', 'circleRef'].forEach((key) => {
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
          if (ref.properties[key].ref) {
            ref.properties[key] = this.getRef(prop.properties[key])
          }
        })
    }
    return ref
  }

  private getFieldSchemaObject(properties: Properties): { [name: string]: OpenAPIV3.NonArraySchemaObject } {
    const result = {}

    Object.keys(properties).forEach((k) => {
      result[k] = this.getFieldSchema(properties[k])
    })

    return result
  }

  private getFieldSchema(property: Property): OpenAPIV3.SchemaObject {
    let type: OpenAPIV3.NonArraySchemaObjectType

    if (property.type === 'ref') {
      property = this.getRef(property)
    }

    if (property.type === 'array') {
      return {
        type: 'array',
        default: property.defaultValue,
        description: property.description,
        items: this.getFieldSchema(property.items[0]),
      }
    }

    if (property.type === 'map') {
      return {
        type: 'object',
        description: property.description,
        properties: {
          '*': this.getFieldSchema(property.items[0]),
        },
        example: property.exampleValue,
      }
    }

    switch (property.type) {
      case 'object':
      case 'json':
      case 'map':
        type = 'object'
        break
      case 'boolean':
        type = 'boolean'
        break
      case 'integer':
      case 'biginteger':
      case 'decimal':
      case 'double':
        type = 'number'
        break
      default:
        type = 'string'
    }

    const result: OpenAPIV3.NonArraySchemaObject = {
      type,
      default: property.defaultValue,
      description: property.description,
      example: property.exampleValue,
    }

    if (type === 'object') {
      result.properties = this.getFieldSchemaObject(property.properties)
      result.required = Object.keys(property.properties).filter((k) => {
        return property.properties[k].required
      })
    }

    return result
  }

  private getParameter(property: Property, type: string): OpenAPIV3.ParameterObject[] {
    const result: OpenAPIV3.ParameterObject[] = []
    if (property && property.properties) {
      Object.keys(property.properties).forEach((name) => {
        const prop = property.properties[name]
        result.push({
          name,
          in: type,
          description: prop.description,
          schema: this.getFieldSchema(prop),
        })
      })
    }
    return result
  }

  private getParameters(route: Route): OpenAPIV3.ParameterObject[] {
    return [
      ...this.getParameter(route.requestHeaders, 'header'),
      ...this.getParameter(route.routeParams, 'path'),
      ...this.getParameter(route.queryString, 'query'),
    ]
  }

  private getMedia(header: Property, body: Property): string {
    let type: string

    switch (body.type) {
      case 'string':
      case 'text':
      case 'integer':
        type = 'text/html'
        break
      case 'blob':
        type = 'application/octet-stream'
        break
      default:
        type = 'application/json'
    }

    if (header && header.properties) {
      Object.keys(header.properties).forEach((k) => {
        if (k.toLowerCase() === 'content-type' && header.properties[k]) {
          type = header.properties[k].defaultValue
        }
      })
    }

    return type
  }

  private getResponse(body: Property): OpenAPIV3.MediaTypeObject {
    const content: OpenAPIV3.MediaTypeObject = {
      schema: this.getFieldSchema(body),
    }

    return content
  }

  private getMediaContent(
    headers: Property,
    body: Property,
  ): { content: { [media: string]: OpenAPIV3.MediaTypeObject } } {
    if (!body || (body.properties && Object.keys(body.properties).length === 0)) {
      return undefined
    }

    return {
      content: {
        [this.getMedia(headers, body)]: this.getResponse(body),
      },
    }
  }

  private handleRoute(route: Route) {
    const id = this.getPath(route)
    const path: OpenAPIV3.PathItemObject = this.paths[id] || {}

    const op: OpenAPIV3.OperationObject = {
      summary: route.title,
      description: route.description,
      parameters: this.getParameters(route),
      requestBody: this.getMediaContent(route.requestHeaders, route.requestBody),
      responses: {
        '200': {
          description: route.title,
          ...(this.getMediaContent(route.responseHeaders, route.responseBody) || {}),
        },
      },
      tags: [route.module],
    }

    path[route.method.toLowerCase()] = op

    this.paths[id] = path
  }

  private format() {
    this.paths = {}
    this.components = {}

    this.routes.forEach((route) => {
      this.handleRoute(route)
    })
  }

  getDocument(): OpenAPIV3.Document {
    this.format()

    return {
      openapi: '3.0.0',
      info: {
        title: '',
        version: 'current',
        description: '',
      },
      components: this.components,
      paths: this.paths,
    }
  }
}
