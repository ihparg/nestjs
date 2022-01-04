import { Controller, Get, Header, Req } from '@nestjs/common'
import { DevService } from './dev.service'

@Controller('dev')
export class DevController {
  constructor(private readonly devService: DevService) {}

  @Get('/')
  @Header('content-type', 'text/html; charset=utf-8')
  getHtml(): Promise<string> {
    return this.devService.getStaticFile('public/index.html')
  }

  @Get('/public/**/*.css')
  @Header('content-type', 'text/css; charset=utf-8')
  getCSS(@Req() req: any): Promise<string> {
    return this.devService.getStaticFile(req.path.replace('dev/', ''))
  }

  @Get('/public/**/*.js')
  @Header('content-type', 'application/javascript; charset=utf-8')
  getJS(@Req() req: any): Promise<string> {
    return this.devService.getStaticFile(req.path.replace('dev/', ''))
  }

  @Get('/public/*')
  getStaticFile(@Req() req: any): Promise<string> {
    return this.devService.getStaticFile(req.path.replace('dev/', ''))
  }

  @Get('/swagger')
  getSwagger() {
    return this.devService.getSwagger()
  }
}
