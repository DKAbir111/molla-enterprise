"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersController = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const customers_service_1 = require("./customers.service");
const create_customer_dto_1 = require("./dto/create-customer.dto");
const update_customer_dto_1 = require("./dto/update-customer.dto");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = require("path");
const fs = require("fs");
const avatarStorage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => {
        const parent = path.resolve(__dirname, '..');
        const isDist = path.basename(parent) === 'dist';
        const backendRoot = isDist ? path.resolve(parent, '..') : parent;
        const dir = path.resolve(backendRoot, 'uploads', 'customers');
        try {
            fs.mkdirSync(dir, { recursive: true });
        }
        catch { }
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `customer-${Date.now()}${ext}`);
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
function withPublicAvatar(obj) {
    if (!obj)
        return obj;
    return { ...obj, avatarUrl: obj.avatarUrl ? toPublicUrl(obj.avatarUrl) : obj.avatarUrl };
}
let CustomersController = class CustomersController {
    constructor(customers) {
        this.customers = customers;
    }
    list(req) {
        return this.customers.findAll(req.user.organizationId).then((items) => items.map(withPublicAvatar));
    }
    getOne(req, id) {
        return this.customers.findOne(req.user.organizationId, id).then(withPublicAvatar);
    }
    create(req, dto) {
        return this.customers.create(req.user.organizationId, dto);
    }
    update(req, id, dto) {
        return this.customers.update(req.user.organizationId, id, dto).then(withPublicAvatar);
    }
    remove(req, id) {
        return this.customers.remove(req.user.organizationId, id);
    }
    async uploadAvatar(req, id, file) {
        const avatarPath = file ? '/uploads/customers/' + path.basename(file.path) : undefined;
        const updated = await this.customers.update(req.user.organizationId, id, { avatarUrl: avatarPath });
        return withPublicAvatar(updated);
    }
};
exports.CustomersController = CustomersController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], CustomersController.prototype, "list", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], CustomersController.prototype, "getOne", null);
tslib_1.__decorate([
    (0, common_1.Post)(),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, create_customer_dto_1.CreateCustomerDto]),
    tslib_1.__metadata("design:returntype", void 0)
], CustomersController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id'),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, update_customer_dto_1.UpdateCustomerDto]),
    tslib_1.__metadata("design:returntype", void 0)
], CustomersController.prototype, "update", null);
tslib_1.__decorate([
    (0, common_1.Delete)(':id'),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String]),
    tslib_1.__metadata("design:returntype", void 0)
], CustomersController.prototype, "remove", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id/avatar'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', { storage: avatarStorage })),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.UploadedFile)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], CustomersController.prototype, "uploadAvatar", null);
exports.CustomersController = CustomersController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('customers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('customers'),
    tslib_1.__metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
