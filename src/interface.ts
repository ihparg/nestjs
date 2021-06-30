export interface IProperty {
  required?: boolean
  type: string
  properties?: IProperties
  ref?: string
  defaultValue?: string
  exampleValue?: string
  description?: string
  items?: Array<IProperty>
}

export interface IProperties {
  [key: string]: IProperty
}

export interface IRoute {
  id: string
  title: string
  description?: string
  method: string
  path: string
  queryString?: IProperty
  routeParams?: IProperty
  requestBody?: IProperty
  requestHeaders?: IProperty
  responseBody?: IProperty
  responseHeaders?: IProperty
  refs: Array<string>
  fullPath?: string
}

export interface ISchema {
  id: string
  name: string
  iname?: string
  tag: string
  content: IProperty
  description?: string
}

export interface IDeleteBody {
  id: string
}

export interface Response<T> {
  code: number
  message?: string
  data: T
}
