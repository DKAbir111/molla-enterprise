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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const fs = require("fs");
const path = require("path");
let OrganizationsService = class OrganizationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto, logoPath) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.organizationId)
            throw new common_1.ForbiddenException('Organization already exists for user');
        let finalLogoPath = logoPath;
        if (!finalLogoPath && dto.logoBase64) {
            finalLogoPath = await this.saveBase64(dto.logoBase64, 'org-logo');
        }
        const org = await this.prisma.organization.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                logoUrl: finalLogoPath,
                ownerId: userId,
            },
        });
        await this.prisma.user.update({ where: { id: userId }, data: { organizationId: org.id } });
        return org;
    }
    async findMine(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!(user === null || user === void 0 ? void 0 : user.organizationId))
            return null;
        return this.prisma.organization.findUnique({ where: { id: user.organizationId } });
    }
    async update(userId, id, dto, logoPath) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!(user === null || user === void 0 ? void 0 : user.organizationId) || user.organizationId !== id)
            throw new common_1.ForbiddenException('Not your organization');
        let nextLogo = logoPath;
        if (!nextLogo && dto.logoBase64) {
            nextLogo = await this.saveBase64(dto.logoBase64, `org-${id}-logo`);
        }
        return this.prisma.organization.update({
            where: { id },
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                ...(nextLogo ? { logoUrl: nextLogo } : {}),
            },
        });
    }
    async saveBase64(b64, basename) {
        const match = b64.match(/^data:(.+);base64,(.*)$/);
        const data = match ? match[2] : b64;
        const buffer = Buffer.from(data, 'base64');
        const dir = path.resolve(__dirname, '../../uploads');
        await fs.promises.mkdir(dir, { recursive: true });
        const file = path.join(dir, `${basename}-${Date.now()}.png`);
        await fs.promises.writeFile(file, buffer);
        return '/uploads/' + path.basename(file);
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map