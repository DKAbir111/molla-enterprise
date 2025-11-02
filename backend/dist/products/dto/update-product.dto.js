"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductDto = void 0;
const tslib_1 = require("tslib");
const swagger_1 = require("@nestjs/swagger");
const create_product_dto_1 = require("./create-product.dto");
const class_validator_1 = require("class-validator");
class UpdateProductDto extends (0, swagger_1.PartialType)(create_product_dto_1.CreateProductDto) {
}
exports.UpdateProductDto = UpdateProductDto;
tslib_1.__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether product is active/visible' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    tslib_1.__metadata("design:type", Boolean)
], UpdateProductDto.prototype, "active", void 0);
