import { Controller, Get } from '@nestjs/common'
import { ResponseValidator } from '@graphi/nestjs'
import { UserInfoService } from './user-info.service'

import { GetUserResponse } from './dto/get-user.dto'

@Controller('/api/userInfo')
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService,) {}

  /** 用户信息 */
  @Get('/getUser')
  
  @ResponseValidator(GetUserResponse)
  async GetUser(
  
  
  
  ): Promise<GetUserResponse> {
    const result = await this.userInfoService.getUser(
    
    
    
    )
    return result
  }
}