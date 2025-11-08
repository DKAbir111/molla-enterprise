import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsEmailer } from './alerts.emailer';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'change-me',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsEmailer],
  exports: [AlertsService],
})
export class AlertsModule {}
