import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  FunnelCategory,
  FunnelStepType,
  ElementType,
  ElementStyles,
} from '@kfunnels/shared';

export type FunnelDocument = FunnelModel & Document;

@Schema({ _id: false })
export class ElementStylesModel implements ElementStyles {
  @Prop({ type: String }) backgroundColor?: string;
  @Prop({ type: String }) textColor?: string;
  @Prop({ type: String }) padding?: string;
  @Prop({ type: String }) margin?: string;
  @Prop({ type: String }) textAlign?: 'left' | 'center' | 'right';
  @Prop({ type: String }) fontSize?: string;
  @Prop({ type: String }) fontWeight?: string;
  @Prop({ type: String }) borderRadius?: string;
  @Prop({ type: String }) boxShadow?: string;
  @Prop({ type: String }) border?: string;
  @Prop({ type: String }) maxWidth?: string;
}

@Schema({ _id: false })
export class PageElementModel {
  @Prop({ type: String, required: true }) id: string;
  @Prop({ type: String, required: true }) type: ElementType;
  @Prop({ type: String, required: true }) label: string;
  @Prop({ type: Object, default: {} }) content: Record<string, any>;
  @Prop({ type: ElementStylesModel, default: () => ({}) }) styles?: ElementStylesModel;
}

@Schema({ _id: false })
export class FunnelStepStatsModel {
  @Prop({ default: 0 }) visitors: number;
  @Prop({ default: 0 }) conversions: number;
  @Prop({ default: 0 }) conversionRate: number;
  @Prop({ default: 0 }) revenue: number;
}

@Schema({ _id: false })
export class FunnelStepModel {
  @Prop({ type: String, required: true }) id: string;
  @Prop({ type: String, required: true }) name: string;
  @Prop({ type: String, required: true }) slug: string;
  @Prop({ type: String, required: true }) stepType: FunnelStepType;
  @Prop({ default: 0 }) order: number;
  @Prop({ type: [Object], default: [] }) elements: PageElementModel[];
  @Prop({ type: FunnelStepStatsModel, default: () => ({ visitors: 0, conversions: 0, conversionRate: 0, revenue: 0 }) })
  stats: FunnelStepStatsModel;
  @Prop({ type: Object }) settings?: Record<string, any>;
}

@Schema({ _id: false })
export class FunnelThemeModel {
  @Prop({ default: '#3B82F6' }) primaryColor: string;
  @Prop({ default: '#10B981' }) accentColor: string;
  @Prop({ default: '#F8FAFC' }) backgroundColor: string;
  @Prop({ default: '#0F172A' }) textColor: string;
  @Prop({ default: 'Inter, sans-serif' }) fontFamily: string;
  @Prop({ default: '8px' }) borderRadius: string;
}

@Schema({ _id: false })
export class FunnelStatsModel {
  @Prop({ default: 0 }) totalVisitors: number;
  @Prop({ default: 0 }) totalOptIns: number;
  @Prop({ default: 0 }) totalSales: number;
  @Prop({ default: 0 }) totalRevenue: number;
  @Prop({ default: 0 }) conversionRate: number;
}

@Schema({ timestamps: true })
export class FunnelModel {
  @Prop({ type: String, required: true }) name: string;
  @Prop({ type: String, required: true, unique: true }) slug: string;
  @Prop({ type: String, default: '' }) description: string;
  @Prop({ type: String, default: 'sales' }) category: FunnelCategory;
  @Prop({ type: String, default: 'draft', enum: ['draft', 'published'] }) status: 'draft' | 'published';
  @Prop({ type: String }) targetAudience?: string;
  @Prop({ type: String }) pricePoint?: string;
  @Prop({ type: FunnelThemeModel, default: () => ({
    primaryColor: '#3B82F6',
    accentColor: '#10B981',
    backgroundColor: '#F8FAFC',
    textColor: '#0F172A',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '8px',
  }) })
  theme: FunnelThemeModel;
  @Prop({ type: [Object], default: [] }) steps: FunnelStepModel[];
  @Prop({ type: FunnelStatsModel, default: () => ({
    totalVisitors: 0,
    totalOptIns: 0,
    totalSales: 0,
    totalRevenue: 0,
    conversionRate: 0,
  }) })
  stats: FunnelStatsModel;
}

export const FunnelSchema = SchemaFactory.createForClass(FunnelModel);
