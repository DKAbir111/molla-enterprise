import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
// import { OrdersModule } from './orders/orders.module';
import { SellsModule } from './sells/sells.module';
import { BuysModule } from './buys/buys.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { VendorsModule } from './vendors/vendors.module';
import { AccountsModule } from './accounts/accounts.module';
import { DryingGainsModule } from './drying-gains/drying-gains.module';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Serve uploads from backend/uploads in both dev (src) and prod (dist/src)
    ServeStaticModule.forRoot({
      rootPath: (() => {
        const parent = path.resolve(__dirname, '..'); // dev: backend, prod: backend/dist
        const isDist = path.basename(parent) === 'dist';
        const backendRoot = isDist ? path.resolve(parent, '..') : parent; // -> backend
        return path.resolve(backendRoot, 'uploads');
      })(),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false, redirect: false },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProductsModule,
    CustomersModule,
    // OrdersModule, // replaced by SellsModule
    SellsModule,
    BuysModule,
    TransactionsModule,
    DashboardModule,
    VendorsModule,
    AccountsModule,
    DryingGainsModule,
    AlertsModule,
  ],
})
export class AppModule {}
