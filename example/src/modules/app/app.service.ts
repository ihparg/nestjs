import { Injectable } from '@nestjs/common'
import { Resolvable } from '@graphi/nestjs'
import { AppPostFileResponse, AppPostFileBody } from './dto/app-post-file.dto'

@Injectable()
@Resolvable('./app.service')
export class AppService {
  
  async AppPostFile(body:AppPostFileBody): Promise<AppPostFileResponse> {
    // Write your code here.
    return null
  }

}
