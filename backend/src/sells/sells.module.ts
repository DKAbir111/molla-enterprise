import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsModule } from '../alerts/alerts.module';
import { SellsService } from './sells.service';
import { SellsController } from './sells.controller';

@Module({
  imports: [PrismaModule, AlertsModule],
  providers: [SellsService],
  controllers: [SellsController],
})
export class SellsModule {}
