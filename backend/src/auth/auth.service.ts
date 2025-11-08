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
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email already in use');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({ data: { name: dto.name, email: dto.email, password } });
    const token = await this.sign(user.id, user.email, user.organizationId);
    return { user: this.sanitize(user), token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = await this.sign(user.id, user.email, user.organizationId);
    return { user: this.sanitize(user), token };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return { ok: true }; // Do not leak existence
    const token = cryptoRandom();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30m
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

  private async sign(sub: string, email: string, organizationId?: string | null) {
    return this.jwt.signAsync({ sub, email, organizationId: organizationId ?? undefined });
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
