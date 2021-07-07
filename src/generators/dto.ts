import { IRoute, ISchema } from '../interface'

export const getDtoName = (): string => {
  return ''
}

export class DtoGenerator {
  private schemas: Array<ISchema>

  constructor(schemas: Array<ISchema>) {
    this.schemas = schemas
  }

  generate(route: IRoute): object {
    return {}
  }
}
