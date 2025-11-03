"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const path = require("path");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const organizations_module_1 = require("./organizations/organizations.module");
const products_module_1 = require("./products/products.module");
const customers_module_1 = require("./customers/customers.module");
const sells_module_1 = require("./sells/sells.module");
const buys_module_1 = require("./buys/buys.module");
const transactions_module_1 = require("./transactions/transactions.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const vendors_module_1 = require("./vendors/vendors.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (() => {
                    const parent = path.resolve(__dirname, '..');
                    const isDist = path.basename(parent) === 'dist';
                    const backendRoot = isDist ? path.resolve(parent, '..') : parent;
                    return path.resolve(backendRoot, 'uploads');
                })(),
                serveRoot: '/uploads',
                serveStaticOptions: { index: false, redirect: false },
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            organizations_module_1.OrganizationsModule,
            products_module_1.ProductsModule,
            customers_module_1.CustomersModule,
            sells_module_1.SellsModule,
            buys_module_1.BuysModule,
            transactions_module_1.TransactionsModule,
            dashboard_module_1.DashboardModule,
            vendors_module_1.VendorsModule,
        ],
    })
], AppModule);
