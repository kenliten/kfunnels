import { Injectable } from '@nestjs/common';
import { FunnelsService } from '../funnels/funnels.service';
import { LeadsService } from '../leads/leads.service';
import { OrdersService } from '../orders/orders.service';
import { DashboardMetrics } from '@kfunnels/shared';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly funnelsService: FunnelsService,
    private readonly leadsService: LeadsService,
    private readonly ordersService: OrdersService
  ) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const funnels = await this.funnelsService.findAll();
    const leads = await this.leadsService.findAll();
    const orders = await this.ordersService.findAll();

    const publishedFunnels = funnels.filter((f) => f.status === 'published').length;

    let totalVisitors = 0;
    let totalRevenue = 0;

    for (const f of funnels) {
      totalVisitors += f.stats?.totalVisitors || 0;
      totalRevenue += f.stats?.totalRevenue || 0;
    }

    const totalOrders = orders.length;
    const totalLeads = leads.length;
    const totalConversions = totalLeads + totalOrders;

    const avgConversionRate =
      totalVisitors > 0
        ? Number(((totalConversions / totalVisitors) * 100).toFixed(1))
        : 0;

    return {
      totalFunnels: funnels.length,
      publishedFunnels,
      totalVisitors,
      totalLeads,
      totalOrders,
      totalRevenue,
      avgConversionRate,
      recentOrders: orders.slice(0, 10),
      recentLeads: leads.slice(0, 10),
    };
  }

  async trackView(funnelId: string, stepId?: string): Promise<{ success: boolean }> {
    await this.funnelsService.recordVisitor(funnelId, stepId);
    return { success: true };
  }
}
