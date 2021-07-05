import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  UseInterceptors,
} from '@nestjs/common'
import { join } from 'path'
import { DevService } from './dev.service'
import { TransformInterceptor } from './interceptor'
import { ISchema, IDeleteBody } from './interface'
import { generateInterface } from './generators/interface'
import { TypeOrmGenerator } from './generators/typeorm'

const isERModel = (type) =>
  ['mysql', 'postgres', 'sqlite', 'typeorm'].includes(type)

@Controller('dev/schema')
@UseInterceptors(TransformInterceptor)
export class SchemaController {
  constructor(private readonly devService: DevService) {}

  get dir(): string {
    return process.env.DEV_SCHEMA_PATH || 'data/schemas'
  }

  @Get('/list')
  async getList(): Promise<Array<ISchema>> {
    const schemas = await this.devService.getJsonFileList(this.dir)
    return schemas
  }

  @Post('/save')
  async saveSchema(@Body() body: ISchema): Promise<ISchema> {
    if (!body.id) body.id = this.devService.nextUid()
    await this.devService.saveFile(
      this.devService.resolvePath(this.dir, body.id),
      body,
    )

    const { DEV_INTERFACE_PATH, DEV_TYPEORM_ENTITY_PATH } = process.env

    const schemas = await this.getList()
    if (DEV_INTERFACE_PATH) {
      await generateInterface(schemas, join(process.cwd(), DEV_INTERFACE_PATH))
    }

    if (DEV_TYPEORM_ENTITY_PATH && isERModel(body.tag)) {
      new TypeOrmGenerator(body, DEV_TYPEORM_ENTITY_PATH, schemas).generate()
    }

    return body
  }

  @Delete('/')
  async deleteRoute(@Body() body: IDeleteBody) {
    await this.devService.deleteFile(
      this.devService.resolvePath(this.dir, body.id),
    )

    const { DEV_INTERFACE_PATH } = process.env
    const schemas = await this.getList()
    if (DEV_INTERFACE_PATH) {
      await generateInterface(schemas, join(process.cwd(), DEV_INTERFACE_PATH))
    }
  }
}
