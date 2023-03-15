import { IsNumber, IsOptional, Min, Max } from 'class-validator'
import { Type, Expose } from 'class-transformer'

export class DemoResponse {
  @IsNumber()
  @Type(() => Number)
  @Expose()
  id: number

  /** 年龄 */
  @IsOptional()
  @Min(18)
  @Max(120)
  @IsNumber()
  @Type(() => Number)
  @Expose()
  age?: number

  /** anything */
  @IsOptional()
  @Expose()
  json?: any

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  decimal?: number
}
