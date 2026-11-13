import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import {
  GenerateFunnelDto,
  CopywriterDto,
  CroAuditDto,
} from '@kfunnels/shared';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-funnel')
  async generateFunnel(@Body() dto: GenerateFunnelDto) {
    return await this.aiService.generateFunnel(dto);
  }

  @Post('copywriter')
  async copywriter(@Body() dto: CopywriterDto) {
    return await this.aiService.rewriteCopy(dto);
  }

  @Post('cro-audit')
  async croAudit(@Body() dto: CroAuditDto) {
    return await this.aiService.auditPage(dto);
  }

  @Post('optimize-offer')
  async optimizeOffer(
    @Body() dto: { productName: string; mainPrice: number; targetAudience: string }
  ) {
    return await this.aiService.optimizeOffer(dto);
  }
}
