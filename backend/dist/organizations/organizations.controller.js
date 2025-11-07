"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsController = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = require("path");
const fs = require("fs");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const organizations_service_1 = require("./organizations.service");
const create_organization_dto_1 = require("./dto/create-organization.dto");
const update_organization_dto_1 = require("./dto/update-organization.dto");
const common_2 = require("@nestjs/common");
const storage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => {
        const parent = path.resolve(__dirname, '..');
        const isDist = path.basename(parent) === 'dist';
        const backendRoot = isDist ? path.resolve(parent, '..') : parent;
        const dir = path.resolve(backendRoot, 'uploads');
        try {
            fs.mkdirSync(dir, { recursive: true });
        }
        catch { }
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `org-${Date.now()}${ext}`);
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
function withPublicLogo(obj) {
    if (!obj)
        return obj;
    return { ...obj, logoUrl: obj.logoUrl ? toPublicUrl(obj.logoUrl) : obj.logoUrl };
}
let OrganizationsController = class OrganizationsController {
    constructor(orgs) {
        this.orgs = orgs;
    }
    create(req, dto, file) {
        const logoPath = file ? '/uploads/' + path.basename(file.path) : undefined;
        return this.orgs.create(req.user.userId, dto, logoPath).then(withPublicLogo);
    }
    me(req) {
        return this.orgs.findMine(req.user.userId).then((org) => (org ? withPublicLogo(org) : org));
    }
    settingsMe(req) {
        return this.orgs.getSettings(req.user.userId);
    }
    update(req, id, dto, file) {
        const logoPath = file ? '/uploads/' + path.basename(file.path) : undefined;
        return this.orgs.update(req.user.userId, id, dto, logoPath).then(withPublicLogo);
    }
    updateSettings(req, id, dto) {
        return this.orgs.updateSettings(req.user.userId, id, dto);
    }
};
exports.OrganizationsController = OrganizationsController;
tslib_1.__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ type: create_organization_dto_1.CreateOrganizationDto }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', { storage })),
    tslib_1.__param(0, (0, common_2.Req)()),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__param(2, (0, common_1.UploadedFile)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, create_organization_dto_1.CreateOrganizationDto, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], OrganizationsController.prototype, "create", null);
tslib_1.__decorate([
    (0, common_1.Get)('me'),
    tslib_1.__param(0, (0, common_2.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], OrganizationsController.prototype, "me", null);
tslib_1.__decorate([
    (0, common_1.Get)('me/settings'),
    tslib_1.__param(0, (0, common_2.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], OrganizationsController.prototype, "settingsMe", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ type: update_organization_dto_1.UpdateOrganizationDto }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', { storage })),
    tslib_1.__param(0, (0, common_2.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)()),
    tslib_1.__param(3, (0, common_1.UploadedFile)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, update_organization_dto_1.UpdateOrganizationDto, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], OrganizationsController.prototype, "update", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':id/settings'),
    tslib_1.__param(0, (0, common_2.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], OrganizationsController.prototype, "updateSettings", null);
exports.OrganizationsController = OrganizationsController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('organizations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('organizations'),
    tslib_1.__metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
