import { Module } from '@nestjs/common';
// Remove ServeStaticModule completely
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { SellsModule } from './sells/sells.module';
import { BuysModule } from './buys/buys.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { VendorsModule } from './vendors/vendors.module';
import { AccountsModule } from './accounts/accounts.module';
import { DryingGainsModule } from './drying-gains/drying-gains.module';
import { AlertsModule } from './alerts/alerts.module';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // ServeStaticModule removed - use cloud storage for Vercel
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProductsModule,
    CustomersModule,
    SellsModule,
    BuysModule,
    TransactionsModule,
    DashboardModule,
    VendorsModule,
    AccountsModule,
    DryingGainsModule,
    AlertsModule,
    MailModule,
  ],
})
export class AppModule { }