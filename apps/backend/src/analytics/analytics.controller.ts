import { Body, Controller, Get, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DashboardMetrics } from '@kfunnels/shared';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return await this.analyticsService.getDashboardMetrics();
  }

  @Post('track-view')
  async trackView(@Body() body: { funnelId: string; stepId?: string }) {
    return await this.analyticsService.trackView(body.funnelId, body.stepId);
  }
}
