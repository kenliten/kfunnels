import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FunnelsModule } from '../funnels/funnels.module';
import { AiModule } from '../ai/ai.module';
import { LeadsModule } from '../leads/leads.module';
import { OrdersModule } from '../orders/orders.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env['MONGODB_URI'] || 'mongodb://127.0.0.1:27017/kfunnels',
        serverSelectionTimeoutMS: 3000,
      }),
    }),
    FunnelsModule,
    AiModule,
    LeadsModule,
    OrdersModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
