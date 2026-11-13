export type FunnelCategory =
  | 'lead-gen'
  | 'sales'
  | 'webinar'
  | 'ecommerce'
  | 'membership'
  | 'agency';

export type FunnelStepType =
  | 'optin'
  | 'sales'
  | 'checkout'
  | 'upsell'
  | 'downsell'
  | 'thankyou'
  | 'webinar';

export type ElementType =
  | 'header'
  | 'hero'
  | 'headline'
  | 'subheadline'
  | 'paragraph'
  | 'bullet-list'
  | 'button'
  | 'optin-form'
  | 'checkout-form'
  | 'pricing-table'
  | 'countdown-timer'
  | 'testimonial'
  | 'video-player'
  | 'badge'
  | 'faq-accordion'
  | 'order-bump'
  | 'guarantee-box';

export interface ElementStyles {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  margin?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  boxShadow?: string;
  border?: string;
  maxWidth?: string;
}

export interface PageElement {
  id: string;
  type: ElementType;
  label: string;
  content: any;
  styles?: ElementStyles;
}

export interface FunnelStepSettings {
  orderBump?: {
    enabled: boolean;
    title: string;
    price: number;
    description: string;
  };
  upsellProduct?: {
    title: string;
    price: number;
    originalPrice: number;
    discountBadge: string;
    description: string;
  };
  redirectStepId?: string;
}

export interface FunnelStepStats {
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}

export interface FunnelStep {
  id: string;
  name: string;
  slug: string;
  stepType: FunnelStepType;
  order: number;
  elements: PageElement[];
  stats: FunnelStepStats;
  settings?: FunnelStepSettings;
}

export interface FunnelTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface FunnelStats {
  totalVisitors: number;
  totalOptIns: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
}

export interface Funnel {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: FunnelCategory;
  status: 'draft' | 'published';
  targetAudience?: string;
  pricePoint?: string;
  theme: FunnelTheme;
  steps: FunnelStep[];
  stats: FunnelStats;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Lead {
  _id?: string;
  id?: string;
  funnelId: string;
  stepId: string;
  name: string;
  email: string;
  phone?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt?: string | Date;
}

export interface OrderItem {
  title: string;
  price: number;
  type: 'main' | 'bump' | 'upsell';
}

export interface Order {
  _id?: string;
  id?: string;
  funnelId: string;
  stepId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productTitle: string;
  amount: number;
  items: OrderItem[];
  status: 'paid' | 'pending' | 'refunded';
  createdAt?: string | Date;
}

export interface DashboardMetrics {
  totalFunnels: number;
  publishedFunnels: number;
  totalVisitors: number;
  totalLeads: number;
  totalOrders: number;
  totalRevenue: number;
  avgConversionRate: number;
  recentOrders: Order[];
  recentLeads: Lead[];
}

// AI Contracts
export interface GenerateFunnelDto {
  productName: string;
  niche: string;
  offerType?: string;
  targetAudience: string;
  pricePoint?: string;
  keyBenefits?: string;
  goal?: string;
  tone?: string;
}

export interface GeneratedFunnelResult {
  title: string;
  slug: string;
  category: FunnelCategory;
  targetNiche: string;
  valueProposition: string;
  recommendedPricingStrategy: string;
  conversionTactics: string[];
  steps: Array<{
    name: string;
    slug: string;
    stepType: FunnelStepType;
    headline: string;
    subheadline: string;
    callToAction: string;
    keyBenefits: string[];
    copyDraft: string;
    orderBump?: {
      title: string;
      price: number;
      description: string;
    };
    elements: PageElement[];
  }>;
}

export interface CopywriterDto {
  framework: 'AIDA' | 'PAS' | 'BAB';
  sectionType: string;
  productName: string;
  targetAudience: string;
  keyBenefit: string;
  tone?: string;
  currentCopy?: string;
}

export interface CopywriterResult {
  headlineVariants: string[];
  subheadlines: string[];
  bulletPoints: string[];
  callToAction: string;
  directResponseRationale: string;
}

export interface CroAuditDto {
  pageTitle: string;
  pageType: FunnelStepType;
  elements: Array<{ type: string; content: any }>;
}

export interface CroAuditResult {
  overallScore: number;
  scoreBreakdown: {
    clarity: number;
    urgency: number;
    socialProof: number;
    ctaPower: number;
    mobileReadability: number;
  };
  headlineCritique: string;
  criticalWeaknesses: string[];
  actionableRecommendations: string[];
  suggestedABTestVariants: Array<{
    elementId?: string;
    elementType: string;
    originalConcept: string;
    variantA: string;
    variantB: string;
    hypothesis: string;
  }>;
}
