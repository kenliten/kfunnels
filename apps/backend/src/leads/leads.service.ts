import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeadModel, LeadDocument } from './schemas/lead.schema';
import { Lead } from '@kfunnels/shared';
import { FunnelsService } from '../funnels/funnels.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  private memoryLeads: Map<string, Lead> = new Map();

  constructor(
    @InjectModel(LeadModel.name)
    private readonly leadModel: Model<LeadDocument>,
    private readonly funnelsService: FunnelsService
  ) {}

  async findAll(funnelId?: string): Promise<Lead[]> {
    try {
      const query = funnelId ? { funnelId } : {};
      const leads = await this.leadModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean()
        .exec();
      if (leads && leads.length > 0) {
        return leads as unknown as Lead[];
      }
    } catch (err: any) {
      this.logger.warn(`Fallback to memory for leads findAll: ${err.message}`);
    }

    const all = Array.from(this.memoryLeads.values());
    if (funnelId) {
      return all.filter((l) => l.funnelId === funnelId);
    }
    return all;
  }

  async create(data: Partial<Lead>): Promise<Lead> {
    const payload = {
      funnelId: data.funnelId,
      stepId: data.stepId,
      name: data.name || 'Anonymous Prospect',
      email: data.email || 'lead@example.com',
      phone: data.phone || '',
      tags: data.tags || ['optin'],
      metadata: data.metadata || {},
    };

    // Track conversion on the funnel step
    if (payload.funnelId && payload.stepId) {
      await this.funnelsService.recordConversion(
        payload.funnelId,
        payload.stepId,
        0,
        false
      );
    }

    try {
      const created = new this.leadModel(payload);
      const saved = await created.save();
      const obj = saved.toObject() as unknown as Lead;
      this.memoryLeads.set(obj._id?.toString() || obj.email, obj);
      return obj;
    } catch (err: any) {
      this.logger.warn(`Saving lead to memory: ${err.message}`);
      const id = 'lead-' + Date.now();
      const memLead: Lead = {
        ...payload,
        _id: id,
        id,
        createdAt: new Date(),
      };
      this.memoryLeads.set(id, memLead);
      return memLead;
    }
  }

  async delete(id: string): Promise<{ success: boolean }> {
    try {
      await this.leadModel.findByIdAndDelete(id).exec();
    } catch (e: any) {
      this.logger.warn(`Could not delete lead in mongo: ${e.message}`);
    }
    this.memoryLeads.delete(id);
    return { success: true };
  }
}
