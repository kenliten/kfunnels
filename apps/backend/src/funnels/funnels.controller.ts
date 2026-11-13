import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { FunnelsService } from './funnels.service';
import { Funnel, FunnelStep } from '@kfunnels/shared';

@Controller('funnels')
export class FunnelsController {
  constructor(private readonly funnelsService: FunnelsService) {}

  @Get()
  async findAll(): Promise<Funnel[]> {
    return await this.funnelsService.findAll();
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<Funnel> {
    return await this.funnelsService.findBySlug(slug);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Funnel> {
    return await this.funnelsService.findById(id);
  }

  @Post()
  async create(@Body() body: Partial<Funnel>): Promise<Funnel> {
    return await this.funnelsService.create(body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<Funnel>
  ): Promise<Funnel> {
    return await this.funnelsService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    return await this.funnelsService.delete(id);
  }

  @Post(':id/steps')
  async addStep(
    @Param('id') id: string,
    @Body() step: Partial<FunnelStep>
  ): Promise<Funnel> {
    return await this.funnelsService.addStep(id, step);
  }

  @Put(':id/steps/:stepId')
  async updateStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() step: Partial<FunnelStep>
  ): Promise<Funnel> {
    return await this.funnelsService.updateStep(id, stepId, step);
  }

  @Delete(':id/steps/:stepId')
  async deleteStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string
  ): Promise<Funnel> {
    return await this.funnelsService.deleteStep(id, stepId);
  }

  @Post(':id/clone')
  async clone(@Param('id') id: string): Promise<Funnel> {
    return await this.funnelsService.clone(id);
  }

  @Post('seed')
  async seed(): Promise<{ success: boolean; message: string }> {
    await this.funnelsService.seedDefaultTemplates();
    return { success: true, message: 'Templates seeded successfully' };
  }
}
