import { Body, Controller, Get, Post, Delete, Inject } from '@nestjs/common'
import { join } from 'path'
import { DevService } from './dev.service'
import { Schema, DeleteBody, DevOption } from './interface'
import { generateInterface } from './generators/interface'
import { TypeOrmGenerator } from './generators/typeorm'
import { MongoGenerator } from './generators/mongo'
import { DEV_OPTION } from './constants'
import { SequelizeGenerator } from './generators/sequelize'

@Controller('dev/schema')
export class SchemaController {
  constructor(private readonly devService: DevService, @Inject(DEV_OPTION) private readonly option: DevOption) {}

  get dir(): string {
    return this.option.schemaPath || 'data/schemas'
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

    const { interfacePath, typeormEntityPath, sequelizeEntityPath, mongodbSchemaPath } = this.option

    const schemas = await this.getList()
    if (interfacePath) {
      await generateInterface(schemas, join(process.cwd(), interfacePath))
    }

    if (typeormEntityPath && body.tag === 'typeorm') {
      await new TypeOrmGenerator(body, typeormEntityPath, schemas, this.option.ormUnderscore).generate()
    } else if (sequelizeEntityPath && body.tag === 'sequelize') {
      await new SequelizeGenerator(body, sequelizeEntityPath, schemas, this.option.ormUnderscore).generate()
    } else if (mongodbSchemaPath && body.tag === 'mongodb') {
      await new MongoGenerator(body, mongodbSchemaPath, schemas).generate()
    }

    return body
  }

  @Delete('/')
  async deleteRoute(@Body() body: DeleteBody) {
    await this.devService.deleteFile(this.devService.resolvePath(this.dir, body.id))

    const { interfacePath } = this.option
    const schemas = await this.getList()
    if (interfacePath) {
      await generateInterface(schemas, join(process.cwd(), interfacePath))
    }
  }
}
