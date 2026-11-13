import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FunnelModel, FunnelSchema } from './schemas/funnel.schema';
import { FunnelsController } from './funnels.controller';
import { FunnelsService } from './funnels.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FunnelModel.name, schema: FunnelSchema },
    ]),
  ],
  controllers: [FunnelsController],
  providers: [FunnelsService],
  exports: [FunnelsService],
})
export class FunnelsModule {}
