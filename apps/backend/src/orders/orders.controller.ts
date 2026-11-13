import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from '@kfunnels/shared';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query('funnelId') funnelId?: string): Promise<Order[]> {
    return await this.ordersService.findAll(funnelId);
  }

  @Post()
  async create(@Body() data: Partial<Order>): Promise<Order> {
    return await this.ordersService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    return await this.ordersService.delete(id);
  }
}
