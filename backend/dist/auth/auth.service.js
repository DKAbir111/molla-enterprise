"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    constructor(prisma, jwt, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.mail = mail;
    }
    async register(dto) {
        const email = dto.email.toLowerCase();
        const exists = await this.prisma.user.findUnique({ where: { email } });
        if (exists)
            throw new common_1.BadRequestException('Email already in use');
        const password = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({ data: { name: dto.name, email, password, role: 'owner' } });
        const token = await this.sign(user.id, user.email, user.organizationId, user.role);
        return { user: this.sanitize(user), token };
    }
    async login(dto, meta) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || user.deletedAt)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
            this.prisma.loginActivity.create({
                data: {
                    userId: user.id,
                    ipAddress: meta?.ipAddress,
                    userAgent: meta?.userAgent,
                    deviceLabel: describeUserAgent(meta?.userAgent),
                },
            }),
        ]);
        const token = await this.sign(user.id, user.email, user.organizationId, user.role);
        return { user: this.sanitize(user), token };
    }
    async forgotPassword(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return { ok: true };
        const token = cryptoRandom();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 5);
        await this.prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });
        try {
            await this.mail.sendPasswordReset(user.email, token);
        }
        catch { }
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
    async sign(sub, email, organizationId, role) {
        return this.jwt.signAsync({ sub, email, organizationId: organizationId ?? undefined, role: role ?? undefined });
    }
    sanitize(user) {
        const { password, ...rest } = user;
        return rest;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService, mail_service_1.MailService])
], AuthService);
function cryptoRandom(len = 40) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < len; i++)
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
}
function describeUserAgent(ua) {
    if (!ua)
        return null;
    const str = ua.toLowerCase();
    const device = str.includes('iphone') ? 'iPhone' :
        str.includes('ipad') ? 'iPad' :
            str.includes('android') && str.includes('mobile') ? 'Android Phone' :
                str.includes('android') ? 'Android' :
                    str.includes('mac os') || str.includes('macintosh') ? 'macOS' :
                        str.includes('windows') ? 'Windows' :
                            str.includes('linux') ? 'Linux' : null;
    const browser = str.includes('edg/') ? 'Edge' :
        str.includes('chrome') ? 'Chrome' :
            str.includes('safari') && !str.includes('chrome') ? 'Safari' :
                str.includes('firefox') ? 'Firefox' :
                    str.includes('msie') || str.includes('trident') ? 'Internet Explorer' : null;
    if (!device && !browser)
        return null;
    if (browser && device)
        return `${browser} on ${device}`;
    return browser || device;
}
