"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const update_order_dto_1 = require("./dto/update-order.dto");
const update_order_items_dto_1 = require("./dto/update-order-items.dto");
let OrdersController = class OrdersController {
    constructor(orders) {
        this.orders = orders;
    }
    list(req) {
        return this.orders.findAll(req.user.organizationId);
    }
    create(req, dto) {
        return this.orders.create(req.user.organizationId, dto);
    }
    update(req, id, dto) {
        return this.orders.update(req.user.organizationId, id, dto);
    }
    updateItems(req, id, dto) {
        return this.orders.updateItems(req.user.organizationId, id, dto);
    }
    remove(req, id) {
        return this.orders.remove(req.user.organizationId, id);
    }
};
exports.OrdersController = OrdersController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], OrdersController.prototype, "list", null);
tslib_1.__decorate([
    (0, common_1.Post)(),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, create_order_dto_1.CreateOrderDto]),
    tslib_1.__metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id'),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, update_order_dto_1.UpdateOrderDto]),
    tslib_1.__metadata("design:returntype", void 0)
], OrdersController.prototype, "update", null);
tslib_1.__decorate([
    (0, common_1.Put)(':id/items'),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, update_order_items_dto_1.UpdateOrderItemsDto]),
    tslib_1.__metadata("design:returntype", void 0)
], OrdersController.prototype, "updateItems", null);
tslib_1.__decorate([
    (0, common_1.Delete)(':id'),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], OrdersController.prototype, "remove", null);
exports.OrdersController = OrdersController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('orders'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('orders'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof orders_service_1.OrdersService !== "undefined" && orders_service_1.OrdersService) === "function" ? _a : Object])
], OrdersController);
