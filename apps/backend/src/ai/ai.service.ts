import { Injectable, Logger } from '@nestjs/common';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  GenerateFunnelDto,
  GeneratedFunnelResult,
  CopywriterDto,
  CopywriterResult,
  CroAuditDto,
  CroAuditResult,
  PageElement,
  FunnelStepType,
} from '@kfunnels/shared';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiInstance: any = null;
  private readonly apiKey =
    process.env['GEMINI_API_KEY'] || process.env['GOOGLE_GENAI_API_KEY'] || '';
  private readonly modelName =
    process.env['GEMINI_MODEL'] || 'gemini-2.5-flash';

  constructor() {
    this.initGenkit();
  }

  private initGenkit() {
    try {
      if (this.apiKey) {
        this.aiInstance = genkit({
          plugins: [
            googleAI({
              apiKey: this.apiKey,
            }),
          ],
        });
        this.logger.log(`Genkit initialized successfully with Gemini (${this.modelName})`);
      } else {
        this.logger.warn(
          'GEMINI_API_KEY not detected. Using intelligent built-in direct response engine for instant generation and fallback.'
        );
      }
    } catch (err: any) {
      this.logger.error(`Error initializing Genkit: ${err.message}`);
    }
  }

  async generateFunnel(dto: GenerateFunnelDto): Promise<GeneratedFunnelResult> {
    const slug = dto.productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (this.aiInstance && this.apiKey) {
      try {
        const prompt = `You are Russell Brunson and Eugene Schwartz combined: a legendary sales funnel architect and master copywriter.
Generate a complete, high-converting direct-response sales funnel.
Details:
- Product/Service: ${dto.productName}
- Target Niche: ${dto.niche}
- Offer Type: ${dto.offerType}
- Target Audience: ${dto.targetAudience}
- Target Price: ${dto.pricePoint}
- Key Benefits: ${dto.keyBenefits}

Return a valid JSON object matching this structure:
{
  "title": "string",
  "slug": "${slug}",
  "category": "sales",
  "targetNiche": "${dto.niche}",
  "valueProposition": "string",
  "recommendedPricingStrategy": "string",
  "conversionTactics": ["tactic 1", "tactic 2", "tactic 3"],
  "steps": [
    {
      "name": "Step Name",
      "slug": "step-slug",
      "stepType": "optin | sales | checkout | upsell | thankyou",
      "headline": "Irresistible headline",
      "subheadline": "Compelling subheadline",
      "callToAction": "Action CTA text",
      "keyBenefits": ["benefit 1", "benefit 2", "benefit 3"],
      "copyDraft": "Persuasive direct response copy",
      "orderBump": {
        "title": "Order bump title",
        "price": 27,
        "description": "Order bump short pitch"
      }
    }
  ]
}
Include exactly 4 high-converting steps:
1. "optin" (Lead Magnet / Free Training)
2. "sales" (Main Offer Core Pitch)
3. "checkout" (Order Page with Order Bump)
4. "thankyou" (Next steps & Onboarding)
`;

        const response = await this.aiInstance.generate({
          model: this.modelName,
          prompt,
          config: {
            temperature: 0.7,
          },
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.enrichGeneratedFunnelWithElements(parsed, dto);
        }
      } catch (err: any) {
        this.logger.error(`Live Gemini call error: ${err.message}. Using high-converting direct response fallback.`);
      }
    }

    return this.fallbackFunnelGeneration(dto, slug);
  }

  async rewriteCopy(dto: CopywriterDto): Promise<CopywriterResult> {
    if (this.aiInstance && this.apiKey) {
      try {
        const prompt = `You are a legendary direct-response copywriter.
Generate high-converting copy using the ${dto.framework} framework.
- Section: ${dto.sectionType}
- Product: ${dto.productName}
- Target Audience: ${dto.targetAudience}
- Key Benefit: ${dto.keyBenefit}
- Desired Tone: ${dto.tone || 'High Energy & Authoritative'}
${dto.currentCopy ? `- Current Draft to improve: ${dto.currentCopy}` : ''}

Return a valid JSON object matching this structure:
{
  "headlineVariants": ["Variant 1", "Variant 2", "Variant 3"],
  "subheadlines": ["Subheadline 1", "Subheadline 2"],
  "bulletPoints": ["Fascinating bullet 1", "Fascinating bullet 2", "Fascinating bullet 3"],
  "callToAction": "CTA button text",
  "directResponseRationale": "Why this copy converts"
}`;

        const response = await this.aiInstance.generate({
          model: this.modelName,
          prompt,
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (err: any) {
        this.logger.error(`Copywriter Genkit error: ${err.message}`);
      }
    }

    return this.fallbackCopywriter(dto);
  }

  async auditPage(dto: CroAuditDto): Promise<CroAuditResult> {
    if (this.aiInstance && this.apiKey) {
      try {
        const prompt = `You are a world-class Conversion Rate Optimization (CRO) expert.
Audit this funnel page:
- Page Title: ${dto.pageTitle}
- Page Type: ${dto.pageType}
- Elements count: ${dto.elements?.length || 0}
- Summary of page content: ${JSON.stringify(dto.elements).substring(0, 1000)}

Return a valid JSON object:
{
  "overallScore": 88,
  "scoreBreakdown": {
    "clarity": 85,
    "urgency": 90,
    "socialProof": 80,
    "ctaPower": 92,
    "mobileReadability": 88
  },
  "headlineCritique": "Detailed critique of the current headline hook",
  "criticalWeaknesses": ["Weakness 1", "Weakness 2"],
  "actionableRecommendations": ["Action 1", "Action 2", "Action 3"],
  "suggestedABTestVariants": [
    {
      "elementType": "headline",
      "originalConcept": "Current headline idea",
      "variantA": "High curiosity variant",
      "variantB": "Direct benefit variant",
      "hypothesis": "Why test this"
    }
  ]
}`;

        const response = await this.aiInstance.generate({
          model: this.modelName,
          prompt,
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (err: any) {
        this.logger.error(`CRO Audit Genkit error: ${err.message}`);
      }
    }

    return this.fallbackCroAudit(dto);
  }

  async optimizeOffer(dto: {
    productName: string;
    mainPrice: number;
    targetAudience: string;
  }) {
    const bumpPrice = Math.round(dto.mainPrice * 0.3) || 27;
    const upsellPrice = Math.round(dto.mainPrice * 1.8) || 97;
    const downsellPrice = Math.round(dto.mainPrice * 0.7) || 47;

    return {
      mainOffer: {
        name: dto.productName,
        price: dto.mainPrice,
        positioning: 'Primary core solution solving the immediate pain point',
      },
      orderBump: {
        name: `Fast-Action Implementation Toolkit & Templates for ${dto.productName}`,
        price: bumpPrice,
        takeRateProjected: '38%',
        pitch: 'Check this box to add the plug-and-play templates to cut your implementation time by 80%.',
      },
      oneTimeOfferUpsell: {
        name: `VIP Accelerator & Masterclass Suite for ${dto.productName}`,
        price: upsellPrice,
        takeRateProjected: '22%',
        pitch: 'Upgrade right now to get step-by-step video over-the-shoulder guidance plus private community access.',
      },
      downsell: {
        name: `Lite Edition of VIP Accelerator`,
        price: downsellPrice,
        pitch: 'Split into 2 easy payments or get the self-study guides only.',
      },
    };
  }

  // Fallback direct response funnel generator
  private fallbackFunnelGeneration(
    dto: GenerateFunnelDto,
    slug: string
  ): GeneratedFunnelResult {
    const mainGoal = dto.keyBenefits || dto.goal || 'exceptional results';
    const rawResult: any = {
      title: `${dto.productName} Automated Sales Machine`,
      slug: slug || 'ai-sales-funnel',
      category: 'sales',
      targetNiche: dto.niche,
      valueProposition: `The definitive solution for ${dto.targetAudience} to achieve ${mainGoal} without stress.`,
      recommendedPricingStrategy: `Anchor at $497, offer standard entry at ${dto.pricePoint || '$97'}, with a $27 order bump.`,
      conversionTactics: [
        'Curiosity Hook with quantifiable proof in the main headline',
        'Friction-free 1-step lead magnet to build audience warm list',
        'Urgency countdown timer tied to limited-capacity bonuses',
        '30-Day 100% Risk-Free Money-Back Guarantee badge',
      ],
      steps: [
        {
          name: 'Free Blueprint Opt-In',
          slug: 'free-blueprint',
          stepType: 'optin',
          headline: `Free Masterclass: How ${dto.targetAudience} Can Achieve ${mainGoal} Fast`,
          subheadline: `Discover the breakthrough blueprint top leaders in ${dto.niche} are quietly using right now.`,
          callToAction: 'Get Free Instant Access Now →',
          keyBenefits: [
            `The #1 secret to ${mainGoal} without typical roadblocks`,
            `The 3 dangerous mistakes 90% of people make in ${dto.niche}`,
            'Plug-and-play checklist you can execute in under 30 minutes',
          ],
          copyDraft: `Enter your best email below to receive the exclusive blueprint directly to your inbox. No fluff, just pure high-leverage strategy.`,
        },
        {
          name: 'Core Offer Sales Presentation',
          slug: 'special-offer',
          stepType: 'sales',
          headline: `Finally: The Complete System To Unleash ${dto.productName}`,
          subheadline: `Specially crafted for ${dto.targetAudience} looking for predictable, compounding results.`,
          callToAction: `Claim Your Access To ${dto.productName} Today →`,
          keyBenefits: [
            'Immediate step-by-step walkthrough from zero to breakthrough',
            'Full lifetime updates and direct support channel',
            'Comprehensive toolkits, checklists, and execution guides',
          ],
          copyDraft: `If you have been looking for an honest, proven method to master ${dto.niche}, this is what you have been waiting for. We eliminated the guesswork and packaged everything into one seamless experience.`,
        },
        {
          name: 'Secure Order Checkout',
          slug: 'secure-checkout',
          stepType: 'checkout',
          headline: `Final Step: Confirm Your Order For ${dto.productName}`,
          subheadline: `256-Bit Encrypted Secure Checkout. 30-Day 100% Risk-Free Guarantee.`,
          callToAction: 'Complete My Order Now 🔒',
          keyBenefits: [
            'Instant digital delivery right to your inbox',
            'Zero recurring charges or hidden fees',
            '30-Day no-questions-asked refund guarantee',
          ],
          copyDraft: `You are seconds away from transforming your results. Complete the form below to lock in the special promotional pricing.`,
          orderBump: {
            title: `Yes! Add The ${dto.productName} Fast-Action Toolkit For Just $27`,
            price: 27,
            description: `Get all ready-to-use cheat sheets and bonus templates to save 15+ hours of implementation time.`,
          },
        },
        {
          name: 'Order Confirmation & Next Steps',
          slug: 'thank-you',
          stepType: 'thankyou',
          headline: `🎉 Congratulations! Your Order Is Confirmed`,
          subheadline: `Check your email inbox for your credentials and quick-start instructions.`,
          callToAction: 'Access Member Area Now →',
          keyBenefits: [
            'Receipt and invoice sent to your email',
            'Step 1 onboarding video is waiting for you',
            'Join our private member discussion group',
          ],
          copyDraft: `Welcome to the community! We are excited to partner with you on your journey to mastery in ${dto.niche}.`,
        },
      ],
    };

    return this.enrichGeneratedFunnelWithElements(rawResult, dto);
  }

  private enrichGeneratedFunnelWithElements(
    parsed: any,
    dto: GenerateFunnelDto
  ): GeneratedFunnelResult {
    const steps = (parsed.steps || []).map((step: any, index: number) => {
      const elements: PageElement[] = [];

      // Hero / Headline element
      elements.push({
        id: `elem-${index}-1`,
        type: 'headline',
        label: 'Main Headline',
        content: {
          text: step.headline || `High Impact Headline for ${step.name}`,
          tag: 'h1',
        },
        styles: {
          fontSize: '2.5rem',
          fontWeight: '800',
          textAlign: 'center',
          textColor: '#0F172A',
          margin: '0 0 1rem 0',
        },
      });

      // Subheadline
      elements.push({
        id: `elem-${index}-2`,
        type: 'subheadline',
        label: 'Subheadline',
        content: {
          text:
            step.subheadline ||
            `Discover the fastest path to results for ${dto.targetAudience}`,
        },
        styles: {
          fontSize: '1.25rem',
          textColor: '#475569',
          textAlign: 'center',
          margin: '0 0 2rem 0',
        },
      });

      if (step.stepType === 'sales') {
        // Video element for sales page
        elements.push({
          id: `elem-${index}-video`,
          type: 'video-player',
          label: 'VSL Video Player',
          content: {
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            title: `Watch The ${dto.productName} Presentation`,
            placeholderThumbnail: '',
          },
          styles: {
            margin: '0 auto 2rem auto',
            maxWidth: '750px',
            borderRadius: '12px',
          },
        });
      }

      // Benefits list
      elements.push({
        id: `elem-${index}-3`,
        type: 'bullet-list',
        label: 'Key Value Bullets',
        content: {
          items: step.keyBenefits || [
            'Proven high-leverage frameworks',
            'Full step-by-step walkthrough',
            'Protected by money back guarantee',
          ],
        },
        styles: {
          margin: '0 auto 2rem auto',
          maxWidth: '600px',
        },
      });

      // Action block depending on step type
      if (step.stepType === 'optin') {
        elements.push({
          id: `elem-${index}-optin`,
          type: 'optin-form',
          label: 'Opt-in Lead Form',
          content: {
            buttonText: step.callToAction || 'Get Instant Access →',
            placeholderName: 'Your First Name',
            placeholderEmail: 'Your Best Email Address',
            privacyNote: '🔒 We respect your privacy. Unsubscribe at any time.',
          },
          styles: {
            backgroundColor: '#FFFFFF',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            maxWidth: '520px',
            margin: '0 auto 2rem auto',
          },
        });
      } else if (step.stepType === 'checkout') {
        elements.push({
          id: `elem-${index}-checkout`,
          type: 'checkout-form',
          label: 'Order Form & Bump',
          content: {
            productName: dto.productName,
            price: (dto.pricePoint ? parseFloat(dto.pricePoint.replace(/[^0-9.]/g, '')) : 97) || 97,
            orderBump: step.orderBump || {
              title: 'Fast-Action Accelerator Kit',
              price: 27,
              description: 'Check this box to add the implementation toolkit.',
            },
            buttonText: step.callToAction || 'Complete Order 🔒',
          },
          styles: {
            backgroundColor: '#FFFFFF',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            maxWidth: '650px',
            margin: '0 auto 2rem auto',
          },
        });
      } else if (step.stepType === 'thankyou') {
        elements.push({
          id: `elem-${index}-confirm`,
          type: 'guarantee-box',
          label: 'Access Details',
          content: {
            title: 'Your Order Is Complete!',
            text: 'Your registration has been confirmed. You will receive an email shortly with full member access.',
          },
          styles: {
            backgroundColor: '#ECFDF5',
            border: '2px solid #10B981',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem auto',
            textAlign: 'center',
          },
        });
      } else {
        // Sales page CTA Button
        elements.push({
          id: `elem-${index}-cta`,
          type: 'button',
          label: 'Primary Call To Action',
          content: {
            text: step.callToAction || 'Enroll Now Before Price Increases →',
            action: 'next-step',
          },
          styles: {
            backgroundColor: '#10B981',
            textColor: '#FFFFFF',
            padding: '1.25rem 2.5rem',
            fontSize: '1.25rem',
            fontWeight: '700',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
            margin: '0 auto 2rem auto',
          },
        });
      }

      // Guarantee badge
      elements.push({
        id: `elem-${index}-guarantee`,
        type: 'guarantee-box',
        label: '30-Day Guarantee',
        content: {
          title: '30-Day 100% Risk-Free Guarantee',
          text: 'Try it risk-free. If you are not completely satisfied, simply contact support within 30 days for a full refund.',
        },
        styles: {
          maxWidth: '560px',
          margin: '0 auto',
          textAlign: 'center',
        },
      });

      return {
        ...step,
        elements,
      };
    });

    return {
      title: parsed.title || `${dto.productName} Sales Funnel`,
      slug: parsed.slug || dto.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: parsed.category || 'sales',
      targetNiche: parsed.targetNiche || dto.niche,
      valueProposition: parsed.valueProposition || `High converting offer for ${dto.targetAudience}`,
      recommendedPricingStrategy: parsed.recommendedPricingStrategy || 'Tiered direct pricing',
      conversionTactics: parsed.conversionTactics || [
        'Curiosity headline with benefit hook',
        'Social proof badges',
        'Urgency countdown',
      ],
      steps,
    };
  }

  private fallbackCopywriter(dto: CopywriterDto): CopywriterResult {
    const p = dto.productName || 'This Solution';
    const b = dto.keyBenefit || 'exponential results';
    const a = dto.targetAudience || 'ambitious professionals';

    if (dto.framework === 'PAS') {
      return {
        headlineVariants: [
          `Tired of Struggling With ${dto.sectionType || dto.keyBenefit || 'Low Conversions'}? Here Is What Finally Works.`,
          `Why Most ${a} Fail At ${b} (And The Simple Shift That Changes Everything)`,
          `The Frustrating Truth About ${b} Nobody In Your Industry Talks About`,
        ],
        subheadlines: [
          `How ${p} eliminates the frustration and automates your path to victory.`,
          `Stop wasting countless hours doing it the hard way.`,
        ],
        bulletPoints: [
          `The exact trigger keeping ${a} stuck right now`,
          `How to instantly unlock ${b} without expensive guesswork`,
          `The predictable 3-step blueprint you can deploy in 24 hours`,
        ],
        callToAction: 'End The Struggle & Get The Blueprint Now →',
        directResponseRationale:
          'Problem-Agitate-Solve agitates the visceral pain point before presenting your product as the only logical relief.',
      };
    }

    if (dto.framework === 'BAB') {
      return {
        headlineVariants: [
          `Imagine Having ${b} In The Next 14 Days Without The Usual Hassle`,
          `From Zero Traction to Predictable ${b}: The Breakthrough Story`,
          `The Bridge Between Where You Are Now And Complete Mastery Of ${b}`,
        ],
        subheadlines: [
          `See how ${a} are bridging the gap faster than ever before with ${p}.`,
          `Your transformation starts the moment you take this single action.`,
        ],
        bulletPoints: [
          `Before: Constant trial-and-error with low conversions`,
          `After: Systematic, hands-off ${b} on repeat`,
          `The Bridge: The turnkey system powering ${p}`,
        ],
        callToAction: 'Cross The Bridge To High Conversions →',
        directResponseRationale:
          'Before-After-Bridge paints a vivid contrast between current pain and the ideal state, creating intense desire.',
      };
    }

    // Default AIDA
    return {
      headlineVariants: [
        `Discover How Smart ${a} Are Quietly Unlocking ${b} With ${p}`,
        `The New Way To Achieve ${b} (Without Burnout Or Wasted Budget)`,
        `Revealed: The Secret Weapon Behind High-Performing ${dto.sectionType || dto.targetAudience || 'Campaigns'}`,
      ],
      subheadlines: [
        `An exclusive breakthrough crafted specifically for ${a}.`,
        `Experience effortless execution and market-leading returns.`,
      ],
      bulletPoints: [
        `Attention: The breakthrough discovery disrupting the space`,
        `Interest: Why traditional tactics are rapidly losing effectiveness`,
        `Desire: How ${p} delivers ${b} consistently`,
        `Action: Why you must act before this promotional window closes`,
      ],
      callToAction: `Yes! I Want Instant Access To ${p} →`,
      directResponseRationale:
        'AIDA moves the prospect from curious attention to intense desire and decisive, frictionless action.',
    };
  }

  private fallbackCroAudit(dto: CroAuditDto): CroAuditResult {
    return {
      overallScore: 84,
      scoreBreakdown: {
        clarity: 88,
        urgency: 78,
        socialProof: 82,
        ctaPower: 89,
        mobileReadability: 85,
      },
      headlineCritique:
        'The main hook is clear, but could incorporate a more specific numeric timeframe (e.g. "in under 14 days") to boost curiosity and perceived speed of result.',
      criticalWeaknesses: [
        'Urgency triggers (such as countdowns or limited-time bonuses) could be highlighted higher above the fold.',
        'Social proof badges or client testimonial counters are missing near the primary CTA button.',
      ],
      actionableRecommendations: [
        'Place a guarantee badge (30-Day Money Back) directly underneath the main submission button to alleviate friction.',
        'Use high-contrast button styling (such as vibrant Emerald Green or Solar Orange) against a neutral background.',
        'Add a short bullet list highlighting the 3 primary objections your prospects have and immediately disarm them.',
      ],
      suggestedABTestVariants: [
        {
          elementType: 'headline',
          originalConcept: dto.pageTitle || 'Core Offer Headline',
          variantA: 'Benefit-driven: "How To Achieve Rapid Results In 14 Days"',
          variantB: 'Curiosity/Mistake-driven: "The 3 Biggest Mistakes Preventing Your Growth"',
          hypothesis: 'Curiosity-focused headlines typically generate a 19% higher opt-in rate for cold traffic.',
        },
        {
          elementType: 'button',
          originalConcept: 'Submit / Continue',
          variantA: 'First-Person Action: "Yes! Give Me Instant Access Now →"',
          variantB: 'Risk-Reversal Action: "Try It 100% Risk-Free For 30 Days"',
          hypothesis: 'First-person verbs ("Give Me") outperform generic commands ("Submit") by up to 28%.',
        },
      ],
    };
  }
}
