"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const transactions_service_1 = require("./transactions.service");
const transactions_controller_1 = require("./transactions.controller");
let TransactionsModule = class TransactionsModule {
};
exports.TransactionsModule = TransactionsModule;
exports.TransactionsModule = TransactionsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        controllers: [transactions_controller_1.TransactionsController],
        providers: [transactions_service_1.TransactionsService],
    })
], TransactionsModule);
