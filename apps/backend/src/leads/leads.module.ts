import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadModel, LeadSchema } from './schemas/lead.schema';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { FunnelsModule } from '../funnels/funnels.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LeadModel.name, schema: LeadSchema }]),
    FunnelsModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
