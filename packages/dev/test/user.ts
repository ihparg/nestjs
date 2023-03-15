import {
  IsNumberString,
  IsDate,
  IsString,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Allow,
  ValidateIf,
} from 'class-validator'
import { Type, Expose, Transform } from 'class-transformer'

export class SaveResponseImport {
  @IsBoolean()
  @Transform(({ value }) => (value == null ? undefined : value === 'false' ? false : !!value))
  @Expose()
  default: boolean

  @IsString()
  @Type(() => String)
  @Expose()
  path: string
}

export class SaveResponse {
  @IsNumberString()
  @Type(() => String)
  @Expose()
  id: string

  @IsDate()
  @Type(() => Date)
  @Expose()
  createTime?: Date

  @IsDate()
  @Type(() => Date)
  @Expose()
  lastUpdateTime?: Date

  /** 组件名称，英文，大写驼峰 */
  @IsString()
  @Type(() => String)
  @Expose()
  name: string

  /** 别名 */
  @IsOptional()
  @IsString()
  @Type(() => String)
  @Expose()
  alias?: string

  @IsString()
  @Type(() => String)
  @Expose()
  package: string

  /** 最低匹配版本，遵循semver规范 */
  @IsString()
  @Type(() => String)
  @Expose()
  startVersion: string

  @IsString()
  @Type(() => String)
  @Expose()
  endVersion: string

  @IsString()
  @Type(() => String)
  @Expose()
  tag: string

  @Type(() => Object)
  @Expose()
  @Allow()
  props: { [key: string]: any }

  @Type(() => Object)
  @Expose()
  preProps: { [key: string]: any }

  /** 最后修改用户 */
  @IsString()
  @Type(() => String)
  @Expose()
  uid: string

  /** 展示名称，推荐中文 */
  @IsString()
  @Type(() => String)
  @Expose()
  displayName: string

  @IsOptional()
  @Type(() => SaveResponseImport)
  @ValidateNested()
  @Expose()
  import?: SaveResponseImport
}

export class SaveBodyImport {
  @IsBoolean()
  @Transform(({ value }) => (value == null ? undefined : value === 'false' ? false : !!value))
  @Expose()
  default: boolean

  @IsString()
  @Type(() => String)
  @Expose()
  path: string
}

export class SaveBody {
  /** 组件名称，英文，大写驼峰 */
  @IsString()
  @Type(() => String)
  @Expose()
  name: string

  /** 别名 */
  @IsOptional()
  @IsString()
  @Type(() => String)
  @Expose()
  alias?: string

  @IsString()
  @Type(() => String)
  @Expose()
  package: string

  /** 最低匹配版本，遵循semver规范 */
  @IsString()
  @Type(() => String)
  @Expose()
  startVersion: string

  @IsString()
  @Type(() => String)
  @Expose()
  endVersion: string

  @IsString()
  @Type(() => String)
  @Expose()
  tag: string

  /** 展示名称，推荐中文 */
  @IsString()
  @Type(() => String)
  @Expose()
  displayName: string

  @IsOptional()
  @Type(() => SaveBodyImport)
  @ValidateNested()
  @Expose()
  import?: SaveBodyImport

  @IsOptional()
  @IsNumberString()
  @Type(() => String)
  @Expose()
  id?: string

  @Type(() => Object)
  @Expose()
  @Allow()
  props: { [key: string]: any }

  @Type(() => Object)
  @Expose()
  preProps: { [key: string]: any }

  @Allow()
  hehe: string
}
