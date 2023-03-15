import { IsDate,IsOptional,IsNumberString,Min,Max,IsNumber,ValidateNested } from 'class-validator'
import { Type, Expose } from 'class-transformer'



export class AppPostFileResponse {
  
  
  @IsDate()
  @Type(() => Date)
  @Expose()
  createAt: Date
  
  
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Expose()
  lastUpdateTime?: Date
  
}


export class AppPostFileBodyUser {
  
  
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
  @Expose()
  json?: any
  
  
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  decimal?: number
  
}


export class AppPostFileBody {
  
  
  @IsOptional()
  @Expose()
  file?: any
  
  
  @IsOptional()
  @Type(() => AppPostFileBodyUser)
  @ValidateNested()
  @Expose()
  user?: AppPostFileBodyUser
  
}


