"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const customers_service_1 = require("./customers.service");
const customers_controller_1 = require("./customers.controller");
let CustomersModule = class CustomersModule {
};
exports.CustomersModule = CustomersModule;
exports.CustomersModule = CustomersModule = tslib_1.__decorate([
    (0, common_1.Module)({
        controllers: [customers_controller_1.CustomersController],
        providers: [customers_service_1.CustomersService],
    })
], CustomersModule);
