import { Module } from '@nestjs/common'
import { DryingGainsService } from './drying-gains.service'
import { DryingGainsController } from './drying-gains.controller'

@Module({
  providers: [DryingGainsService],
  controllers: [DryingGainsController],
})
export class DryingGainsModule {}

