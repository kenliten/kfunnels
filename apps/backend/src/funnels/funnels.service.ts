import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FunnelModel, FunnelDocument } from './schemas/funnel.schema';
import { Funnel, FunnelStep, PageElement } from '@kfunnels/shared';

@Injectable()
export class FunnelsService implements OnModuleInit {
  private readonly logger = new Logger(FunnelsService.name);
  // In-memory fallback if mongo is unavailable
  private memoryStore: Map<string, Funnel> = new Map();

  constructor(
    @InjectModel(FunnelModel.name)
    private readonly funnelModel: Model<FunnelDocument>
  ) {}

  async onModuleInit() {
    try {
      const count = await this.funnelModel.countDocuments().exec();
      if (count === 0) {
        this.logger.log('No funnels found in MongoDB. Seeding initial templates...');
        await this.seedDefaultTemplates();
      }
    } catch (err: any) {
      this.logger.warn(`MongoDB check warning: ${err.message}. Initializing in-memory templates.`);
      await this.seedMemoryTemplates();
    }
  }

  async findAll(): Promise<Funnel[]> {
    try {
      const funnels = await this.funnelModel.find().sort({ createdAt: -1 }).lean().exec();
      if (funnels && funnels.length > 0) {
        return funnels as unknown as Funnel[];
      }
    } catch (err: any) {
      this.logger.warn(`Fallback to memory store for findAll: ${err.message}`);
    }
    return Array.from(this.memoryStore.values());
  }

  async findById(id: string): Promise<Funnel> {
    try {
      const funnel = await this.funnelModel.findById(id).lean().exec();
      if (funnel) {
        return funnel as unknown as Funnel;
      }
    } catch (err: any) {
      this.logger.warn(`Fallback to memory store for findById: ${err.message}`);
    }
    const mem = this.memoryStore.get(id);
    if (!mem) {
      // Also search by _id or slug
      for (const f of this.memoryStore.values()) {
        if (f.id === id || f._id === id || f.slug === id) {
          return f;
        }
      }
      throw new NotFoundException(`Funnel with ID "${id}" not found`);
    }
    return mem;
  }

  async findBySlug(slug: string): Promise<Funnel> {
    try {
      const funnel = await this.funnelModel.findOne({ slug }).lean().exec();
      if (funnel) {
        return funnel as unknown as Funnel;
      }
    } catch (err: any) {
      this.logger.warn(`Fallback to memory store for findBySlug: ${err.message}`);
    }
    for (const f of this.memoryStore.values()) {
      if (f.slug === slug) {
        return f;
      }
    }
    throw new NotFoundException(`Funnel with slug "${slug}" not found`);
  }

  async create(data: Partial<Funnel>): Promise<Funnel> {
    const slug =
      data.slug ||
      (data.name || 'funnel')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const funnelPayload: Partial<Funnel> = {
      name: data.name || 'New Funnel',
      slug,
      description: data.description || '',
      category: data.category || 'sales',
      status: data.status || 'draft',
      targetAudience: data.targetAudience || 'Target Audience',
      pricePoint: data.pricePoint || '$97',
      theme: data.theme || {
        primaryColor: '#3B82F6',
        accentColor: '#10B981',
        backgroundColor: '#F8FAFC',
        textColor: '#0F172A',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '8px',
      },
      steps: data.steps || [],
      stats: data.stats || {
        totalVisitors: 0,
        totalOptIns: 0,
        totalSales: 0,
        totalRevenue: 0,
        conversionRate: 0,
      },
    };

    try {
      const created = new this.funnelModel(funnelPayload);
      const saved = await created.save();
      const result = saved.toObject() as unknown as Funnel;
      this.memoryStore.set(result._id?.toString() || result.slug, result);
      return result;
    } catch (err: any) {
      this.logger.warn(`Error creating funnel in MongoDB: ${err.message}. Saving to memory.`);
      const id = 'mem-' + Date.now();
      const memFunnel = {
        ...funnelPayload,
        _id: id,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Funnel;
      this.memoryStore.set(id, memFunnel);
      return memFunnel;
    }
  }

  async update(id: string, data: Partial<Funnel>): Promise<Funnel> {
    try {
      const updated = await this.funnelModel
        .findByIdAndUpdate(id, { $set: data }, { new: true })
        .lean()
        .exec();
      if (updated) {
        const res = updated as unknown as Funnel;
        this.memoryStore.set(id, res);
        return res;
      }
    } catch (err: any) {
      this.logger.warn(`MongoDB update fallback to memory: ${err.message}`);
    }

    const existing = await this.findById(id);
    const updatedMem: Funnel = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.memoryStore.set(id, updatedMem);
    return updatedMem;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    try {
      await this.funnelModel.findByIdAndDelete(id).exec();
    } catch (err: any) {
      this.logger.warn(`MongoDB delete fallback: ${err.message}`);
    }
    this.memoryStore.delete(id);
    return { success: true };
  }

  async addStep(funnelId: string, stepData: Partial<FunnelStep>): Promise<Funnel> {
    const funnel = await this.findById(funnelId);
    const newStep: FunnelStep = {
      id: 'step-' + Date.now(),
      name: stepData.name || 'New Step',
      slug:
        stepData.slug ||
        (stepData.name || 'step').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      stepType: stepData.stepType || 'sales',
      order: funnel.steps.length,
      elements: stepData.elements || [],
      stats: { visitors: 0, conversions: 0, conversionRate: 0, revenue: 0 },
      settings: stepData.settings || {},
    };

    funnel.steps.push(newStep);
    return await this.update(funnelId, { steps: funnel.steps });
  }

  async updateStep(
    funnelId: string,
    stepId: string,
    stepData: Partial<FunnelStep>
  ): Promise<Funnel> {
    const funnel = await this.findById(funnelId);
    const stepIdx = funnel.steps.findIndex((s) => s.id === stepId);
    if (stepIdx === -1) {
      throw new NotFoundException(`Step with ID "${stepId}" not found`);
    }

    funnel.steps[stepIdx] = {
      ...funnel.steps[stepIdx],
      ...stepData,
    };

    return await this.update(funnelId, { steps: funnel.steps });
  }

  async deleteStep(funnelId: string, stepId: string): Promise<Funnel> {
    const funnel = await this.findById(funnelId);
    funnel.steps = funnel.steps.filter((s) => s.id !== stepId);
    return await this.update(funnelId, { steps: funnel.steps });
  }

  async clone(id: string): Promise<Funnel> {
    const original = await this.findById(id);
    const clonedData: Partial<Funnel> = {
      ...original,
      _id: undefined,
      id: undefined,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: 'draft',
      stats: {
        totalVisitors: 0,
        totalOptIns: 0,
        totalSales: 0,
        totalRevenue: 0,
        conversionRate: 0,
      },
    };
    return await this.create(clonedData);
  }

  async recordVisitor(funnelId: string, stepId?: string): Promise<void> {
    try {
      const funnel = await this.findById(funnelId);
      funnel.stats.totalVisitors = (funnel.stats.totalVisitors || 0) + 1;

      if (stepId) {
        const step = funnel.steps.find((s) => s.id === stepId || s.slug === stepId);
        if (step) {
          step.stats.visitors = (step.stats.visitors || 0) + 1;
          step.stats.conversionRate =
            step.stats.visitors > 0
              ? Number(((step.stats.conversions / step.stats.visitors) * 100).toFixed(1))
              : 0;
        }
      }

      const totalConversions =
        (funnel.stats.totalOptIns || 0) + (funnel.stats.totalSales || 0);
      funnel.stats.conversionRate =
        funnel.stats.totalVisitors > 0
          ? Number(((totalConversions / funnel.stats.totalVisitors) * 100).toFixed(1))
          : 0;

      await this.update(funnelId, { stats: funnel.stats, steps: funnel.steps });
    } catch (e: any) {
      this.logger.warn(`Could not record visitor: ${e.message}`);
    }
  }

  async recordConversion(
    funnelId: string,
    stepId: string,
    revenue = 0,
    isSale = false
  ): Promise<void> {
    try {
      const funnel = await this.findById(funnelId);
      if (isSale) {
        funnel.stats.totalSales = (funnel.stats.totalSales || 0) + 1;
        funnel.stats.totalRevenue = (funnel.stats.totalRevenue || 0) + revenue;
      } else {
        funnel.stats.totalOptIns = (funnel.stats.totalOptIns || 0) + 1;
      }

      const step = funnel.steps.find((s) => s.id === stepId || s.slug === stepId);
      if (step) {
        step.stats.conversions = (step.stats.conversions || 0) + 1;
        step.stats.revenue = (step.stats.revenue || 0) + revenue;
        step.stats.conversionRate =
          step.stats.visitors > 0
            ? Number(((step.stats.conversions / step.stats.visitors) * 100).toFixed(1))
            : 100;
      }

      const totalConversions =
        (funnel.stats.totalOptIns || 0) + (funnel.stats.totalSales || 0);
      funnel.stats.conversionRate =
        funnel.stats.totalVisitors > 0
          ? Number(((totalConversions / funnel.stats.totalVisitors) * 100).toFixed(1))
          : 0;

      await this.update(funnelId, { stats: funnel.stats, steps: funnel.steps });
    } catch (e: any) {
      this.logger.warn(`Could not record conversion: ${e.message}`);
    }
  }

  // Pre-built High-Converting Templates
  async seedDefaultTemplates(): Promise<void> {
    const templates = this.getPrebuiltTemplates();
    for (const t of templates) {
      try {
        const created = new this.funnelModel(t);
        const saved = await created.save();
        const obj = saved.toObject() as unknown as Funnel;
        this.memoryStore.set(obj._id?.toString() || obj.slug, obj);
      } catch (err: any) {
        this.memoryStore.set('seed-' + t.slug, {
          ...t,
          _id: 'seed-' + t.slug,
          id: 'seed-' + t.slug,
        } as Funnel);
      }
    }
    this.logger.log(`Seeded ${templates.length} pre-built direct-response funnels.`);
  }

  private async seedMemoryTemplates(): Promise<void> {
    const templates = this.getPrebuiltTemplates();
    for (const t of templates) {
      const id = 'mem-' + t.slug;
      this.memoryStore.set(id, {
        ...t,
        _id: id,
        id,
      } as Funnel);
    }
  }

  private getPrebuiltTemplates(): Partial<Funnel>[] {
    return [
      {
        name: 'AI SaaS Automated Growth Machine',
        slug: 'ai-saas-growth-funnel',
        description:
          'Full-stack funnel designed to convert cold B2B traffic into free trials, annual upfront buyers, and VIP onboarding add-ons.',
        category: 'sales',
        status: 'published',
        targetAudience: 'Software Founders & Marketing Executives',
        pricePoint: '$197/mo or $1,490/yr',
        theme: {
          primaryColor: '#6366F1',
          accentColor: '#10B981',
          backgroundColor: '#0B0F19',
          textColor: '#F8FAFC',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '10px',
        },
        stats: {
          totalVisitors: 3420,
          totalOptIns: 1120,
          totalSales: 214,
          totalRevenue: 42180,
          conversionRate: 39.0,
        },
        steps: [
          {
            id: 'saas-step-1',
            name: 'Interactive Growth Blueprint & Calculator',
            slug: 'optin',
            stepType: 'optin',
            order: 0,
            stats: {
              visitors: 3420,
              conversions: 1120,
              conversionRate: 32.7,
              revenue: 0,
            },
            elements: [
              {
                id: 'e1',
                type: 'badge',
                label: 'Announcement Badge',
                content: { text: '⚡ Breakthrough 2026 AI Growth Engine' },
                styles: {
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  textColor: '#A5B4FC',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  margin: '0 auto 1rem auto',
                  textAlign: 'center',
                },
              },
              {
                id: 'e2',
                type: 'headline',
                label: 'Main Headline',
                content: {
                  text: 'Scale Your Funnels 10X Faster With Autonomous AI Copy & Optimization',
                  tag: 'h1',
                },
                styles: {
                  fontSize: '2.75rem',
                  fontWeight: '800',
                  textAlign: 'center',
                  textColor: '#FFFFFF',
                  margin: '0 0 1rem 0',
                },
              },
              {
                id: 'e3',
                type: 'subheadline',
                label: 'Subheadline',
                content: {
                  text: 'Turn cold traffic into high-ticket conversions without hiring expensive copywriters or agencies.',
                },
                styles: {
                  fontSize: '1.25rem',
                  textColor: '#94A3B8',
                  textAlign: 'center',
                  margin: '0 0 2rem 0',
                },
              },
              {
                id: 'e4',
                type: 'optin-form',
                label: 'Lead Form',
                content: {
                  buttonText: 'Claim Free 14-Day Enterprise Access →',
                  placeholderName: 'Your Name or Company',
                  placeholderEmail: 'Work Email Address',
                  privacyNote: '🔒 Instant access. No credit card required.',
                },
                styles: {
                  backgroundColor: '#1E293B',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '520px',
                  margin: '0 auto 2rem auto',
                },
              },
            ],
          },
          {
            id: 'saas-step-2',
            name: 'Enterprise Checkout & Order Bump',
            slug: 'checkout',
            stepType: 'checkout',
            order: 1,
            stats: {
              visitors: 1120,
              conversions: 214,
              conversionRate: 19.1,
              revenue: 42180,
            },
            settings: {
              orderBump: {
                enabled: true,
                title: '⚡ Add 1-on-1 AI Funnel Architecture Review for $97',
                price: 97,
                description: 'Our senior conversion engineers will personally review and optimize your funnel elements.',
              },
            },
            elements: [
              {
                id: 'e5',
                type: 'headline',
                label: 'Order Headline',
                content: {
                  text: 'Upgrade to Unlimited Scale & AI Multi-Model Power',
                  tag: 'h1',
                },
                styles: {
                  fontSize: '2.25rem',
                  fontWeight: '800',
                  textAlign: 'center',
                  textColor: '#FFFFFF',
                  margin: '0 0 1rem 0',
                },
              },
              {
                id: 'e6',
                type: 'checkout-form',
                label: 'Checkout Element',
                content: {
                  productName: 'K-Funnels Pro Annual Plan',
                  price: 197,
                  orderBump: {
                    title: '⚡ Add 1-on-1 AI Funnel Architecture Review for $97',
                    price: 97,
                    description: 'Get your funnel audited and optimized by our top conversion architect.',
                  },
                  buttonText: 'Authorize & Activate License 🔒',
                },
                styles: {
                  backgroundColor: '#1E293B',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '650px',
                  margin: '0 auto',
                },
              },
            ],
          },
          {
            id: 'saas-step-3',
            name: 'Success & Access Hub',
            slug: 'thank-you',
            stepType: 'thankyou',
            order: 2,
            stats: {
              visitors: 214,
              conversions: 214,
              conversionRate: 100,
              revenue: 0,
            },
            elements: [
              {
                id: 'e7',
                type: 'headline',
                label: 'Welcome Headline',
                content: {
                  text: '🚀 Welcome to K-Funnels! Your AI Workspace Is Ready',
                  tag: 'h1',
                },
                styles: {
                  fontSize: '2.5rem',
                  textAlign: 'center',
                  textColor: '#10B981',
                  margin: '0 0 1rem 0',
                },
              },
              {
                id: 'e8',
                type: 'paragraph',
                label: 'Next Steps',
                content: {
                  text: 'We have dispatched your API keys, credentials, and onboarding links to your inbox. Click below to enter your dashboard.',
                },
                styles: {
                  textAlign: 'center',
                  textColor: '#CBD5E1',
                  margin: '0 0 2rem 0',
                },
              },
            ],
          },
        ],
      },
      {
        name: 'High-Ticket Mastermind Coaching Funnel',
        slug: 'high-ticket-mastermind',
        description:
          'Russell Brunson style application & consultation funnel for coaches, consultants, and agencies charging $3,000 - $10,000.',
        category: 'agency',
        status: 'published',
        targetAudience: 'Consultants, Agency Owners, & Coaches',
        pricePoint: '$3,500',
        theme: {
          primaryColor: '#D97706',
          accentColor: '#2563EB',
          backgroundColor: '#FFFFFF',
          textColor: '#0F172A',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '8px',
        },
        stats: {
          totalVisitors: 1840,
          totalOptIns: 590,
          totalSales: 42,
          totalRevenue: 147000,
          conversionRate: 34.3,
        },
        steps: [
          {
            id: 'coach-step-1',
            name: 'Case Study & Exclusive Training VSL',
            slug: 'case-study',
            stepType: 'sales',
            order: 0,
            stats: {
              visitors: 1840,
              conversions: 590,
              conversionRate: 32.1,
              revenue: 0,
            },
            elements: [
              {
                id: 'c1',
                type: 'headline',
                label: 'Headline',
                content: {
                  text: 'How We Generated $1.2M in 90 Days Using Autonomous Funnels',
                  tag: 'h1',
                },
                styles: {
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  textAlign: 'center',
                  textColor: '#0F172A',
                  margin: '0 0 1rem 0',
                },
              },
              {
                id: 'c2',
                type: 'video-player',
                label: 'Video Presentation',
                content: {
                  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  title: 'Private Coaching Masterclass',
                },
                styles: {
                  maxWidth: '750px',
                  margin: '0 auto 2rem auto',
                },
              },
              {
                id: 'c3',
                type: 'button',
                label: 'Apply Button',
                content: {
                  text: 'Apply For The Private Mastermind (Only 4 Spots Open) →',
                  action: 'next-step',
                },
                styles: {
                  backgroundColor: '#D97706',
                  textColor: '#FFFFFF',
                  padding: '1.25rem 2.5rem',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  borderRadius: '8px',
                  textAlign: 'center',
                  margin: '0 auto',
                },
              },
            ],
          },
          {
            id: 'coach-step-2',
            name: 'Private Application & Deposit',
            slug: 'apply',
            stepType: 'checkout',
            order: 1,
            stats: {
              visitors: 590,
              conversions: 42,
              conversionRate: 7.1,
              revenue: 147000,
            },
            elements: [
              {
                id: 'c4',
                type: 'headline',
                label: 'Application Headline',
                content: {
                  text: 'Step 2: Submit Your Private Application & Seat Deposit',
                  tag: 'h1',
                },
                styles: {
                  fontSize: '2rem',
                  textAlign: 'center',
                  margin: '0 0 1rem 0',
                },
              },
              {
                id: 'c5',
                type: 'checkout-form',
                label: 'Deposit Form',
                content: {
                  productName: 'VIP Mastermind Deposit (100% Refundable if not accepted)',
                  price: 500,
                  buttonText: 'Submit Application & Lock Deposit 🔒',
                },
                styles: {
                  maxWidth: '600px',
                  margin: '0 auto',
                  padding: '2rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                },
              },
            ],
          },
        ],
      },
    ];
  }
}
