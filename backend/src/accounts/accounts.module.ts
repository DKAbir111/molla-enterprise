import { Module } from '@nestjs/common'
import { AccountsController } from './accounts.controller'
import { AccountsService } from './accounts.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}

