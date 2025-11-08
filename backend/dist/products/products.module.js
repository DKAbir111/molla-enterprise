"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
const products_controller_1 = require("./products.controller");
const alerts_module_1 = require("../alerts/alerts.module");
let ProductsModule = class ProductsModule {
};
exports.ProductsModule = ProductsModule;
exports.ProductsModule = ProductsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [alerts_module_1.AlertsModule],
        controllers: [products_controller_1.ProductsController],
        providers: [products_service_1.ProductsService],
    })
], ProductsModule);
