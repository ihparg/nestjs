import { Module } from '@nestjs/common'
import { UserInfoController } from './user-info.controller'
import { UserInfoService } from './user-info.service'

@Module({
  controllers: [UserInfoController],
  providers: [UserInfoService], 
})
export class UserInfoModule {}