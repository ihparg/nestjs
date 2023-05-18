# 介绍

Nestjs Dev 是一个基于 nestjs 的开发辅助模块，通过图形化定义数据结构（Schema）和路由（Route）生成 interface, entity, dto, controller, service, api 等代码。

## Usage

在项目根目录下，创建一个 dev.ts 文件，引入 DevModule，可以启动一个开发后台

```typescript
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
  DevModule,
  SwaggerModule,
  TransformInterceptor,
  ValidationPipe,
  DevOption,
} from '@graphi/nestjs'

const options: DevOption = {...}

@Module({
  imports: [
    // 注册开发模块
    DevModule.forRoot(options),
    // 注册swagger
    SwaggerModule.forRoot(options),
  ],
})
class MainModule {}

async function bootstrap() {
  const app = await NestFactory.create(MainModule)

  // 输入参数校验和过滤
  app.useGlobalPipes(new ValidationPipe())
  // 可选，输出参数包装
  app.useGlobalInterceptors(new TransformInterceptor())

  await app.listen(3001)
}

bootstrap()
```

## DevOption 配置

```typescript
export interface DevOption {
  /**
   * Schemas 存储目录，默认值为: data/schemas
   */
  schemaPath?: string;

  /**
   * Routes 存储目录，默认值为：data/routes
   */
  routePath?: string;

  /**
   * interface.ts 存储文件地址
   */
  interfacePath?: string;

  /**
   * 前端接口文件目录
   */
  webApiPath?: string;

  /**
   * 前端接口fetch文件路径
   */
  webApiFetchPath?: string;

  /**
   * 前端接口host
   */
  webApiHost?: string;

  /**
   * typeorm entity 存储目录
   */
  typeormEntityPath?: string;

  /**
   * sequelize entity 存储目录
   */
  sequelizeEntityPath?: string;

  /**
   * 是否转驼峰为下划线
   */
  ormUnderscore?: boolean;

  /**
   * mongodb schema 存储目录
   */
  mongodbSchemaPath?: string;

  /**
   * 模块存储目录
   */
  modulePath?: string;

  /**
   * api 前缀
   */
  apiPrefix?: string;

  defaultFields?: Properties;
}
```
