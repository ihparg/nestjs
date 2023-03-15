import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { DevModule, SwaggerModule } from './dev'

const getPath = (url: string) => `../../example/${url}`

const options = {
  schemaPath: getPath('schemas'),
  routePath: getPath('routes'),
  interfacePath: getPath('src/interface.ts'),
  typeormEntityPath: getPath('src/models'),
  sequelizeEntityPath: getPath('src/models'),
  ormUnderscore: true,
  mongodbSchemaPath: getPath('src/models'),
  modulePath: getPath('src/modules'),
  webApiPath: getPath('web/apis'),
  webApiFetchPath: getPath('web/apis/fetch'),
  webApiHost: '${process.env.HOST}',
  apiPrefix: '/api',
  defaultFields: {
    createAt: {
      type: 'datetime',
      index: true,
      defaultValue: 'CURRENT_TIMESTAMP',
      required: true,
    },
    lastUpdateTime: {
      type: 'datetime',
      index: true,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
}

@Module({
  imports: [DevModule.forRoot(options), SwaggerModule.forRoot(options)],
  controllers: [AppController],
})
export class AppModule {}
