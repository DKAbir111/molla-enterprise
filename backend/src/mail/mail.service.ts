import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {}

  private buildTransport(opts: { host: string; port: number; secure: boolean }) {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const allowInvalid = String(this.config.get<string>('SMTP_ALLOW_INVALID_CERTS') || '').toLowerCase() === 'true';
    const logger = String(this.config.get<string>('SMTP_DEBUG') || '').toLowerCase() === 'true';
    return nodemailer.createTransport({
      host: opts.host,
      port: opts.port,
      secure: opts.secure, // true = implicit TLS (465). false = STARTTLS upgrade (587)
      auth: user && pass ? { user, pass } : undefined,
      requireTLS: !opts.secure, // nudge STARTTLS for 587
      tls: allowInvalid ? { rejectUnauthorized: false } : undefined,
      logger,
    } as any);
  }

  private getTransport() {
    if (this.transporter) return this.transporter;
    const host = this.config.get<string>('SMTP_HOST');
    let port = Number(this.config.get<number>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const secureEnv = String(this.config.get<string>('SMTP_SECURE') || '').toLowerCase() === 'true';
    let secure = secureEnv || port === 465;
    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuration missing; emails will not be sent');
      return null;
    }
    this.transporter = this.buildTransport({ host, port, secure });
    return this.transporter;
  }

  async sendPasswordReset(to: string, token: string) {
    const tx = this.getTransport();
    if (!tx) return false;
    const from = this.config.get<string>('SMTP_FROM') || 'no-reply@localhost';
    const appUrl = (this.config.get<string>('APP_PUBLIC_URL') || 'http://localhost:3000').replace(/\/$/, '');
    // Default to English locale path; your middleware should redirect appropriately
    const resetUrl = `${appUrl}/en/reset-password?token=${encodeURIComponent(token)}`;

    const subject = 'Password reset request';
    const text = `We received a password reset request. Click the button in this email to reset your password.`;
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; color:#111;">
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to reset it. If you did not request this, you can ignore this email.</p>
        <p style="margin:20px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#6d28d9;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reset Password</a>
        </p>
      </div>
    `;

    try {
      await tx.sendMail({ from, to, subject, text, html });
      return true;
    } catch (err: any) {
      const msg = String(err?.message || err)
      this.logger.error(`Failed to send password reset email to ${to}: ${msg}`);
      // Common TLS mismatch: try a single fallback by toggling secure/port between 465<->587
      try {
        const host = this.config.get<string>('SMTP_HOST')!;
        let port = Number(this.config.get<number>('SMTP_PORT') ?? 587);
        const secureEnv = String(this.config.get<string>('SMTP_SECURE') || '').toLowerCase() === 'true';
        let secure = secureEnv || port === 465;
        const alt = (secure || port === 465) ? { port: 587, secure: false } : { port: 465, secure: true };
        this.logger.warn(`Retrying mail send with fallback transport (port=${alt.port}, secure=${alt.secure})`);
        const retryTx = this.buildTransport({ host, port: alt.port, secure: alt.secure });
        await retryTx.sendMail({ from, to, subject, text, html });
        this.transporter = retryTx; // keep the working transport
        return true;
      } catch (e2: any) {
        this.logger.error(`Fallback send failed: ${e2?.message || e2}`);
        return false;
      }
    }
  }
}
