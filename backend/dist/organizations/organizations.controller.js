"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsController = void 0;
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
        const dir = path.join(process.cwd(), 'backend', 'uploads');
        try {
            fs.mkdirSync(dir, { recursive: true });
        }
        catch (_a) { }
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `org-${Date.now()}${ext}`);
    },
});
let OrganizationsController = class OrganizationsController {
    constructor(orgs) {
        this.orgs = orgs;
    }
    create(req, dto, file) {
        const logoPath = file ? '/uploads/' + path.basename(file.path) : undefined;
        return this.orgs.create(req.user.userId, dto, logoPath);
    }
    me(req) {
        return this.orgs.findMine(req.user.userId);
    }
    update(req, id, dto, file) {
        const logoPath = file ? '/uploads/' + path.basename(file.path) : undefined;
        return this.orgs.update(req.user.userId, id, dto, logoPath);
    }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ type: create_organization_dto_1.CreateOrganizationDto }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', { storage })),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_organization_dto_1.CreateOrganizationDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "me", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ type: update_organization_dto_1.UpdateOrganizationDto }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', { storage })),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_organization_dto_1.UpdateOrganizationDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "update", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, swagger_1.ApiTags)('organizations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('organizations'),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
//# sourceMappingURL=organizations.controller.js.map