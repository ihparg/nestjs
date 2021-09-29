import { ValidationError } from '@nestjs/common'

export interface Property {
  required?: boolean
  type: string
  properties?: Properties
  ref?: string
  defaultValue?: string
  exampleValue?: string
  description?: string
  items?: Array<Property>
  circleRef: string
  enum?: {
    text: string
    value: string
  }[]
}

export interface Properties {
  [key: string]: Property
}

export interface Route {
  id: string
  title: string
  description?: string
  method: string
  path: string
  queryString?: Property
  routeParams?: Property
  requestBody?: Property
  requestHeaders?: Property
  responseBody?: Property
  responseHeaders?: Property
  refs: Array<string>
  fullPath?: string
  module: string
  functionName: string
  resolve: string
}

export interface Schema {
  id: string
  name: string
  iname?: string
  tag: string
  content: Property
  description?: string
}

export interface DeleteBody {
  id: string
}

export interface Response<T> {
  code: number
  message?: string
  data: T
}

export type UidFunction = () => string

export type ClassConstructor<T> = {
  new (...args: any[]): T
}

export type ResponseFunction = <T>(data: T, errors: ValidationError[]) => unknown
