import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { Lead } from '@kfunnels/shared';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async findAll(@Query('funnelId') funnelId?: string): Promise<Lead[]> {
    return await this.leadsService.findAll(funnelId);
  }

  @Post()
  async create(@Body() data: Partial<Lead>): Promise<Lead> {
    return await this.leadsService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    return await this.leadsService.delete(id);
  }
}
