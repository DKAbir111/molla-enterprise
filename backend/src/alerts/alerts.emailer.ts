import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AlertsEmailer {
  private readonly logger = new Logger(AlertsEmailer.name)
  constructor(private prisma: PrismaService, private alerts: AlertsService, private mail: MailService) {}

  private sumCounts(a: any): number {
    if (!a) return 0
    return (a.lowStock?.count || 0) + (a.pendingOrders?.agingCount || 0) + (a.receivables?.count || 0) + (a.payables?.count || 0)
  }

  private buildHtml(orgName: string, data: any) {
    const block = (title: string, items: any[], format: (x: any) => string) => {
      if (!items || items.length === 0) return ''
      const lis = items.slice(0, 5).map((x) => `<li>${format(x)}</li>`).join('')
      return `<h3 style="margin:16px 0 8px;">${title}</h3><ul>${lis}</ul>`
    }
    const parts = [
      block('Low Stock', data.lowStock?.items, (p) => `${p.name} — ${p.stock} left`),
      block('Aging Orders', data.pendingOrders?.items?.filter((o: any) => o.ageHours >= 24), (o) => `#${String(o.id).slice(0,6)} — ${o.customerName} — ${o.ageHours}h`),
      block('Receivables', data.receivables?.items, (r) => `${r.customerName} — Due ${r.due}`),
      block('Payables', data.payables?.items, (r) => `${r.vendorName} — Due ${r.due}`),
    ].filter(Boolean).join('')
    return `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111;font-size:14px;">
        <p>Hello from ${orgName}, here is your alerts summary.</p>
        ${parts || '<p>No new alerts.</p>'}
        <p style="margin-top:20px;font-size:12px;color:#555;">You can control these emails in Settings → Notifications.</p>
      </div>
    `
  }

  // Run every morning at 9:00, or override with ALERTS_DIGEST_CRON
  @Cron(process.env.ALERTS_DIGEST_CRON || CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyDigest() {
    const settings = await (this.prisma as any).organizationSettings.findMany({ where: { emailAlerts: true }, select: { organizationId: true } })
    for (const s of settings) {
      const org = await this.prisma.organization.findUnique({ where: { id: s.organizationId }, select: { name: true, email: true } })
      if (!org?.email) continue
      const data = await this.alerts.getAlerts(s.organizationId, 5)
      if (this.sumCounts(data) === 0) continue
      const ok = await this.mail.sendGeneric(org.email, `Alerts summary for ${org.name}`, this.buildHtml(org.name, data))
      if (!ok) this.logger.warn(`Failed to send digest to ${org.email}`)
    }
  }
}

