import { Module } from '@nestjs/common'
import { DevModule } from './dev'

@Module({
  imports: [
    DevModule.forRoot({
      schemaPath: 'test/data/schemas',
      routePath: 'test/data/routes',
      interfacePath: 'test/data/interface.ts',
      typeormEntityPath: 'test/data/models',
      typeormUnderscore: true,
      mongodbSchemaPath: 'test/data/models',
      modulePath: 'test/data/modules',
      //apiPrefix: 'api',
    }),
  ],
})
export class AppModule {}
