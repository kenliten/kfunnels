import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderModel, OrderDocument } from './schemas/order.schema';
import { Order } from '@kfunnels/shared';
import { FunnelsService } from '../funnels/funnels.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private memoryOrders: Map<string, Order> = new Map();

  constructor(
    @InjectModel(OrderModel.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly funnelsService: FunnelsService
  ) {}

  async findAll(funnelId?: string): Promise<Order[]> {
    try {
      const query = funnelId ? { funnelId } : {};
      const orders = await this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean()
        .exec();
      if (orders && orders.length > 0) {
        return orders as unknown as Order[];
      }
    } catch (err: any) {
      this.logger.warn(`Fallback to memory for orders findAll: ${err.message}`);
    }

    const all = Array.from(this.memoryOrders.values());
    if (funnelId) {
      return all.filter((o) => o.funnelId === funnelId);
    }
    return all;
  }

  async create(data: Partial<Order>): Promise<Order> {
    const totalAmount =
      data.amount ||
      (data.items || []).reduce((sum, item) => sum + (item.price || 0), 0) ||
      97;

    const payload = {
      funnelId: data.funnelId,
      stepId: data.stepId,
      customerName: data.customerName || 'Customer',
      customerEmail: data.customerEmail || 'customer@example.com',
      customerPhone: data.customerPhone || '',
      productTitle: data.productTitle || 'Digital Product Package',
      amount: totalAmount,
      items: data.items || [{ title: data.productTitle || 'Main Offer', price: totalAmount, type: 'main' as const }],
      status: data.status || ('paid' as const),
    };

    // Track sale and revenue on the funnel step
    if (payload.funnelId && payload.stepId) {
      await this.funnelsService.recordConversion(
        payload.funnelId,
        payload.stepId,
        totalAmount,
        true
      );
    }

    try {
      const created = new this.orderModel(payload);
      const saved = await created.save();
      const obj = saved.toObject() as unknown as Order;
      this.memoryOrders.set(obj._id?.toString() || obj.customerEmail, obj);
      return obj;
    } catch (err: any) {
      this.logger.warn(`Saving order to memory: ${err.message}`);
      const id = 'ord-' + Date.now();
      const memOrder: Order = {
        ...payload,
        _id: id,
        id,
        createdAt: new Date(),
      };
      this.memoryOrders.set(id, memOrder);
      return memOrder;
    }
  }

  async delete(id: string): Promise<{ success: boolean }> {
    try {
      await this.orderModel.findByIdAndDelete(id).exec();
    } catch (e: any) {
      this.logger.warn(`Could not delete order in mongo: ${e.message}`);
    }
    this.memoryOrders.delete(id);
    return { success: true };
  }
}
