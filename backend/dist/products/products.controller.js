"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const products_service_1 = require("./products.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = require("path");
const fs = require("fs");
const productStorage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => {
        const parent = path.resolve(__dirname, '..');
        const isDist = path.basename(parent) === 'dist';
        const backendRoot = isDist ? path.resolve(parent, '..') : parent;
        const dir = path.resolve(backendRoot, 'uploads', 'products');
        try {
            fs.mkdirSync(dir, { recursive: true });
        }
        catch { }
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `product-${Date.now()}${ext}`);
    },
});
function toPublicUrl(p) {
    if (!p)
        return p;
    if (/^https?:\/\//i.test(p))
        return p;
    const base = (process.env.PUBLIC_BASE_URL || process.env.API_PUBLIC_BASE || 'http://localhost:4000').replace(/\/$/, '');
    const pathPart = p.startsWith('/') ? p : `/${p}`;
    return `${base}${pathPart}`;
}
function withPublicImage(obj) {
    if (!obj)
        return obj;
    return { ...obj, imageUrl: obj.imageUrl ? toPublicUrl(obj.imageUrl) : obj.imageUrl };
}
let ProductsController = class ProductsController {
    constructor(products) {
        this.products = products;
    }
    list(req) {
        return this.products.findAll(req.user.organizationId).then((items) => items.map(withPublicImage));
    }
    create(req, dto) {
        return this.products.create(req.user.organizationId, dto).then(withPublicImage);
    }
    update(req, id, dto) {
        return this.products.update(req.user.organizationId, id, dto).then(withPublicImage);
    }
    remove(req, id) {
        return this.products.remove(req.user.organizationId, id);
    }
    async uploadImage(req, id, file) {
        const imagePath = file ? '/uploads/products/' + path.basename(file.path) : undefined;
        const updated = await this.products.update(req.user.organizationId, id, {}, imagePath);
        return withPublicImage(updated);
    }
};
exports.ProductsController = ProductsController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], ProductsController.prototype, "list", null);
tslib_1.__decorate([
    (0, common_1.Post)(),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, create_product_dto_1.CreateProductDto]),
    tslib_1.__metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id'),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, update_product_dto_1.UpdateProductDto]),
    tslib_1.__metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
tslib_1.__decorate([
    (0, common_1.Delete)(':id'),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], ProductsController.prototype, "remove", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id/image'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', { storage: productStorage })),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.UploadedFile)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductsController.prototype, "uploadImage", null);
exports.ProductsController = ProductsController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('products'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('products'),
    tslib_1.__metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
