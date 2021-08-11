import { Body, Controller, Get, Post, Delete } from '@nestjs/common'
import { join } from 'path'
import { DevService } from './dev.service'
import { Schema, DeleteBody } from './interface'
import { generateInterface } from './generators/interface'
import { TypeOrmGenerator } from './generators/typeorm'
import { MongoGenerator } from './generators/mongo'

const isERModel = (type) => ['mysql', 'postgres', 'sqlite', 'typeorm'].includes(type)

@Controller('dev/schema')
export class SchemaController {
  constructor(private readonly devService: DevService) {}

  get dir(): string {
    return process.env.DEV_SCHEMA_PATH || 'data/schemas'
  }

  @Get('/list')
  async getList(): Promise<Array<Schema>> {
    const schemas = await this.devService.getJsonFileList(this.dir)
    return schemas
  }

  @Post('/save')
  async saveSchema(@Body() body: Schema): Promise<Schema> {
    if (!body.id) body.id = this.devService.nextUid()
    await this.devService.saveFile(this.devService.resolvePath(this.dir, body.id), body)

    const { DEV_INTERFACE_PATH, DEV_TYPEORM_ENTITY_PATH, DEV_MONGODB_SCHEMA_PATH } = process.env

    const schemas = await this.getList()
    if (DEV_INTERFACE_PATH) {
      await generateInterface(schemas, join(process.cwd(), DEV_INTERFACE_PATH))
    }

    if (DEV_TYPEORM_ENTITY_PATH && isERModel(body.tag)) {
      new TypeOrmGenerator(body, DEV_TYPEORM_ENTITY_PATH, schemas).generate()
    } else if (DEV_MONGODB_SCHEMA_PATH && body.tag === 'mongodb') {
      new MongoGenerator(body, DEV_MONGODB_SCHEMA_PATH, schemas).generate()
    }

    return body
  }

  @Delete('/')
  async deleteRoute(@Body() body: DeleteBody) {
    await this.devService.deleteFile(this.devService.resolvePath(this.dir, body.id))

    const { DEV_INTERFACE_PATH } = process.env
    const schemas = await this.getList()
    if (DEV_INTERFACE_PATH) {
      await generateInterface(schemas, join(process.cwd(), DEV_INTERFACE_PATH))
    }
  }
}
