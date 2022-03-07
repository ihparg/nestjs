import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { DevModule } from './dev'

@Module({
  imports: [
    DevModule.forRoot({
      schemaPath: 'test/data/schemas',
      routePath: 'test/data/routes',
      interfacePath: 'test/data/interface.ts',
      typeormEntityPath: 'test/data/models',
      sequelizeEntityPath: 'test/data/models',
      ormUnderscore: true,
      mongodbSchemaPath: 'test/data/models',
      modulePath: 'test/data/modules',
      webApiPath: 'test/data/apis',
      webApiFetchPath: 'test/data/apis/fetch',
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
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
