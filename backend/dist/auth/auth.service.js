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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async register(dto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists)
            throw new common_1.BadRequestException('Email already in use');
        const password = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({ data: { name: dto.name, email: dto.email, password } });
        const token = await this.sign(user.id, user.email, user.organizationId);
        return { user: this.sanitize(user), token };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const token = await this.sign(user.id, user.email, user.organizationId);
        return { user: this.sanitize(user), token };
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user)
            return { ok: true };
        const token = cryptoRandom();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
        await this.prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });
        return { ok: true, token };
    }
    async resetPassword(dto) {
        const prt = await this.prisma.passwordResetToken.findUnique({ where: { token: dto.token } });
        if (!prt || prt.used || prt.expiresAt < new Date())
            throw new common_1.BadRequestException('Invalid or expired token');
        const password = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({ where: { id: prt.userId }, data: { password } });
        await this.prisma.passwordResetToken.update({ where: { token: dto.token }, data: { used: true } });
        return { ok: true };
    }
    async sign(sub, email, organizationId) {
        return this.jwt.signAsync({ sub, email, organizationId: organizationId !== null && organizationId !== void 0 ? organizationId : undefined });
    }
    sanitize(user) {
        const { password, ...rest } = user;
        return rest;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
function cryptoRandom(len = 40) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < len; i++)
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
}
//# sourceMappingURL=auth.service.js.map