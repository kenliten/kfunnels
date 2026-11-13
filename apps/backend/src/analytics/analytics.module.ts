import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { FunnelsModule } from '../funnels/funnels.module';
import { LeadsModule } from '../leads/leads.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [FunnelsModule, LeadsModule, OrdersModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
