import { Controller, Post,Body } from '@nestjs/common'
import { ResponseValidator } from '@graphi/nestjs'
import { AppService } from './app.service'

import { AppPostFileResponse, AppPostFileBody } from './dto/app-post-file.dto'

@Controller('/api/app')
export class AppController {
  constructor(private readonly appService: AppService,) {}

  /** 上传文件 */
  @Post('/app/post-file')
  
  @ResponseValidator(AppPostFileResponse)
  async AppPostFile(
  
  @Body() body: AppPostFileBody,
  
  ): Promise<AppPostFileResponse> {
    const result = await this.appService.AppPostFile(
    
    body,
    
    )
    return result
  }
}