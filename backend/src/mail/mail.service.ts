import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {}

  /**
   * Builds the transport from SMTP_HOST/PORT/USER/PASS. Returns null (and logs
   * once) when SMTP isn't configured — callers treat that as "email disabled"
   * and keep working. Port 465 implies TLS; anything else uses STARTTLS.
   */
  private getTransport() {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured; emails will not be sent');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return this.transporter;
  }

  private from() {
    return this.config.get<string>('SMTP_FROM') || 'no-reply@localhost';
  }

  async sendPasswordReset(to: string, token: string) {
    const tx = this.getTransport();
    if (!tx) return false;

    const appUrl = (this.config.get<string>('APP_PUBLIC_URL') || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${appUrl}/en/reset-password?token=${encodeURIComponent(token)}`;

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; color:#111;">
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to reset it. If you did not request this, you can ignore this email.</p>
        <p style="margin:20px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reset Password</a>
        </p>
      </div>
    `;

    return this.send(to, 'Password reset request', html);
  }

  async sendGeneric(to: string, subject: string, html: string) {
    return this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string) {
    const tx = this.getTransport();
    if (!tx) return false;
    try {
      await tx.sendMail({ from: this.from(), to, subject, html });
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err?.message || err}`);
      return false;
    }
  }
}
