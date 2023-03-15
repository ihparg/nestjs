import { IsNumberString,IsOptional,Min,Max,IsNumber,Allow,MinLength,MaxLength,IsString,ValidateNested } from 'class-validator'
import { Type, Expose } from 'class-transformer'



export class GetUserResponseObject {
  
  
  @IsOptional()
  @MinLength(2)
  @MaxLength(10)
  @IsString()
  @Type(() => String)
  @Expose()
  firstName?: string
  
  
  @IsOptional()
  @IsString()
  @Type(() => String)
  @Expose()
  lastName?: string
  
}


export class GetUserResponse {
  
  
  @IsNumberString()
  @Type(() => String)
  @Expose()
  id: string
  
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
  @Allow()
  @Expose()
  json?: any
  
  
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  decimal?: number
  
  
  @IsOptional()
  @Type(() => GetUserResponseObject)
  @ValidateNested()
  @Expose()
  object?: GetUserResponseObject
  
  
  @IsOptional()
  @Allow()
  @Type(() => Object)
  @Expose()
  map?: { [key:string]: string }
  
}


