"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const tslib_1 = require("tslib");
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
        return this.jwt.signAsync({ sub, email, organizationId: organizationId ?? undefined });
    }
    sanitize(user) {
        const { password, ...rest } = user;
        return rest;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
function cryptoRandom(len = 40) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < len; i++)
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
}
