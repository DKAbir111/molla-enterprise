import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BuysService } from './buys.service';
import { BuysController } from './buys.controller';

@Module({
  imports: [PrismaModule],
  providers: [BuysService],
  controllers: [BuysController],
})
export class BuysModule {}

