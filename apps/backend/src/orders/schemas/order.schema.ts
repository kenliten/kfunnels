import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OrderItem } from '@kfunnels/shared';

export type OrderDocument = OrderModel & Document;

@Schema({ timestamps: true })
export class OrderModel {
  @Prop({ type: String, required: true }) funnelId: string;
  @Prop({ type: String, required: true }) stepId: string;
  @Prop({ type: String, required: true }) customerName: string;
  @Prop({ type: String, required: true }) customerEmail: string;
  @Prop({ type: String }) customerPhone?: string;
  @Prop({ type: String, required: true }) productTitle: string;
  @Prop({ type: Number, required: true }) amount: number;
  @Prop({ type: [Object], default: [] }) items: OrderItem[];
  @Prop({ type: String, default: 'paid', enum: ['paid', 'pending', 'refunded'] }) status: 'paid' | 'pending' | 'refunded';
}

export const OrderSchema = SchemaFactory.createForClass(OrderModel);
