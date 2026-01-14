import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private mail: MailService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email already in use');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({ data: { name: dto.name, email, password, role: 'owner' } });
    const token = await this.sign(user.id, user.email, user.organizationId, user.role);
    return { user: this.sanitize(user), token };
  }

  async login(dto: LoginDto, meta?: { ipAddress?: string; userAgent?: string }) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { ok: true }; // Do not leak existence
    const token = cryptoRandom();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes
    await this.prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });
    // Send email (best-effort)
    try { await this.mail.sendPasswordReset(user.email, token); } catch {}
    // Keep returning token for dev/testing convenience
    return { ok: true, token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const prt = await this.prisma.passwordResetToken.findUnique({ where: { token: dto.token } });
    if (!prt || prt.used || prt.expiresAt < new Date()) throw new BadRequestException('Invalid or expired token');
    const password = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: prt.userId }, data: { password } });
    await this.prisma.passwordResetToken.update({ where: { token: dto.token }, data: { used: true } });
    return { ok: true };
  }

  private async sign(sub: string, email: string, organizationId?: string | null, role?: string | null) {
    return this.jwt.signAsync({ sub, email, organizationId: organizationId ?? undefined, role: role ?? undefined });
  }

  private sanitize(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }
}

function cryptoRandom(len = 40) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function describeUserAgent(ua?: string | null) {
  if (!ua) return null;
  const str = ua.toLowerCase();
  const device =
    str.includes('iphone') ? 'iPhone' :
      str.includes('ipad') ? 'iPad' :
        str.includes('android') && str.includes('mobile') ? 'Android Phone' :
          str.includes('android') ? 'Android' :
            str.includes('mac os') || str.includes('macintosh') ? 'macOS' :
              str.includes('windows') ? 'Windows' :
                str.includes('linux') ? 'Linux' : null;
  const browser =
    str.includes('edg/') ? 'Edge' :
      str.includes('chrome') ? 'Chrome' :
        str.includes('safari') && !str.includes('chrome') ? 'Safari' :
          str.includes('firefox') ? 'Firefox' :
            str.includes('msie') || str.includes('trident') ? 'Internet Explorer' : null;
  if (!device && !browser) return null;
  if (browser && device) return `${browser} on ${device}`;
  return browser || device;
}
