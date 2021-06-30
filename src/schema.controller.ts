import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common'
import { join } from 'path'
import { DevService } from './dev.service'
import { TransformInterceptor } from './interceptor'
import { ISchema } from './interface'
import { generateInterface } from './interface.generator'
import { TypeOrmGenerator } from './typeorm.generator'

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

    await generateInterface(
      schemas,
      join(process.cwd(), process.env.INTERFACE_PATH),
    )

    return schemas
  }

  @Post('/save')
  async saveSchema(@Body() body: ISchema): Promise<ISchema> {
    if (!body.id) body.id = this.devService.nextUid()
    await this.devService.saveFile(
      this.devService.resolvePath(this.dir, body.id),
      body,
    )

    const { INTERFACE_PATH, TYPEORM_ENTITY_PATH } = process.env

    const schemas = await this.getList()
    if (INTERFACE_PATH) {
      await generateInterface(schemas, join(process.cwd(), INTERFACE_PATH))
    }

    if (TYPEORM_ENTITY_PATH && isERModel(body.tag)) {
      const typeorm = new TypeOrmGenerator(body, TYPEORM_ENTITY_PATH, schemas)
      await typeorm.generate()
    }

    return body
  }
}
