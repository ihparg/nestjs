import { Injectable } from '@nestjs/common'
import { Resolvable } from '@graphi/nestjs'
import { GetUserResponse } from './dto/get-user.dto'

@Injectable()
@Resolvable('./user-info.service')
export class UserInfoService {
  
  async getUser(): Promise<GetUserResponse> {
    // Write your code here.
    return null
  }

}
