import { Controller, Get, Query, UseGuards, Req, Sse, BadRequestException, MessageEvent } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AlertsService } from './alerts.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Observable, interval, map, startWith, switchMap, distinctUntilChanged } from 'rxjs';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private alerts: AlertsService, private jwt: JwtService, private prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  get(@Req() req: any, @Query('limit') limit?: string) {
    const n = Math.max(1, Math.min(50, Number(limit || 5)));
    return this.alerts.getAlerts(req.user.organizationId, n);
  }

  // Lightweight Server-Sent Events for near real-time updates without polling headers
  @Sse('stream')
  stream(@Req() req: any, @Query('limit') limit?: string, @Query('token') token?: string): Observable<MessageEvent> {
    const n = Math.max(1, Math.min(50, Number(limit || 5)));
    // Try to resolve a bearer token from query or cookie
    const cookie = String(req.headers?.cookie || '');
    const cookieToken = (cookie.match(/(?:^|;\s*)bm_token=([^;]+)/)?.[1])
      ? decodeURIComponent(cookie.match(/(?:^|;\s*)bm_token=([^;]+)/)![1])
      : undefined;
    const raw = token || cookieToken;
    if (!raw) throw new BadRequestException('Missing token');
    let userId: string | undefined;
    try {
      const payload: any = this.jwt.verify(raw);
      userId = payload?.sub;
    } catch {
      throw new BadRequestException('Invalid token');
    }
    if (!userId) throw new BadRequestException('Invalid token');
    // Resolve current org at connect time
    const orgIdPromise = this.prisma.user.findUnique({ where: { id: userId } }).then(u => u?.organizationId || null);

    return new Observable<MessageEvent>((subscriber) => {
      let stopped = false;
      orgIdPromise.then((orgId) => {
        if (!orgId || stopped) {
          subscriber.error(new BadRequestException('Organization required'));
          return;
        }
        const sub = interval(15000)
          .pipe(
            startWith(0),
            switchMap(() => this.alerts.getAlerts(orgId, n)),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
            map((data) => ({ data }) as MessageEvent),
          )
          .subscribe({
            next: (ev) => subscriber.next(ev),
            error: (err) => subscriber.error(err),
          });
        return () => sub.unsubscribe();
      }).catch((err) => subscriber.error(err));
      return () => { stopped = true };
    });
  }
}
