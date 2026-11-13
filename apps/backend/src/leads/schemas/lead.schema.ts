import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LeadDocument = LeadModel & Document;

@Schema({ timestamps: true })
export class LeadModel {
  @Prop({ type: String, required: true }) funnelId: string;
  @Prop({ type: String, required: true }) stepId: string;
  @Prop({ type: String, required: true }) name: string;
  @Prop({ type: String, required: true }) email: string;
  @Prop({ type: String }) phone?: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ type: Object, default: {} }) metadata?: Record<string, any>;
}

export const LeadSchema = SchemaFactory.createForClass(LeadModel);
