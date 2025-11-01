"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrderItemsDto = void 0;
const tslib_1 = require("tslib");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdateOrderItemInput {
}
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], UpdateOrderItemInput.prototype, "productId", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    tslib_1.__metadata("design:type", Number)
], UpdateOrderItemInput.prototype, "quantity", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    tslib_1.__metadata("design:type", Number)
], UpdateOrderItemInput.prototype, "price", void 0);
class UpdateOrderItemsDto {
}
exports.UpdateOrderItemsDto = UpdateOrderItemsDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ type: [UpdateOrderItemInput] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateOrderItemInput),
    tslib_1.__metadata("design:type", Array)
], UpdateOrderItemsDto.prototype, "items", void 0);
