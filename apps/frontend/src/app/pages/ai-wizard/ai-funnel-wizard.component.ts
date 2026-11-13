import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { FunnelService } from '../../core/services/funnel.service';
import { GeneratedFunnelResult, Funnel } from '@kfunnels/shared';

@Component({
  selector: 'app-ai-funnel-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="wizard-container animate-fadein">
      <!-- Wizard Header -->
      <div class="wizard-header">
        <div class="ai-badge">
          <i class="pi pi-sparkles"></i>
          <span>GENKIT + GEMINI AI ARCHITECT</span>
        </div>
        <h1 class="wizard-title">AI Sales Funnel Architect</h1>
        <p class="wizard-subtitle">
          Generate an entire high-converting direct-response sales funnel with headlines, copy, order bumps, and layout in seconds.
        </p>
      </div>

      <!-- Step 1: Input Form -->
      <div class="wizard-card" *ngIf="!generatedResult && !loading">
        <div class="form-grid">
          <div class="form-group">
            <label>Product or Service Name *</label>
            <input
              type="text"
              [(ngModel)]="formData.productName"
              placeholder="e.g. FunnelCopy Accelerator"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Target Niche *</label>
            <input
              type="text"
              [(ngModel)]="formData.niche"
              placeholder="e.g. B2B SaaS, Fitness Coaching, Real Estate"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Offer Type</label>
            <select [(ngModel)]="formData.offerType" class="form-input">
              <option value="Lead Magnet & Core Offer">Lead Magnet & Core Offer (Opt-in + Sales Page)</option>
              <option value="Video Sales Letter (VSL)">Video Sales Letter (VSL) Presentation</option>
              <option value="High-Ticket Application">High-Ticket Application & Consultation</option>
              <option value="eCommerce Flash Sale">eCommerce Product with Order Bump</option>
              <option value="Automated Masterclass">Automated Masterclass & Webinar</option>
            </select>
          </div>

          <div class="form-group">
            <label>Target Price Point</label>
            <input
              type="text"
              [(ngModel)]="formData.pricePoint"
              placeholder="e.g. $97 or $497"
              class="form-input"
            />
          </div>

          <div class="form-group full-width">
            <label>Target Audience Description *</label>
            <input
              type="text"
              [(ngModel)]="formData.targetAudience"
              placeholder="e.g. Agency owners who struggle with client retention and consistent lead generation"
              class="form-input"
            />
          </div>

          <div class="form-group full-width">
            <label>Core Transformation & Key Benefits *</label>
            <textarea
              [(ngModel)]="formData.keyBenefits"
              rows="3"
              placeholder="e.g. Automates daily prospecting, generates 20+ qualified sales calls every month without spending on ads"
              class="form-input"
            ></textarea>
          </div>
        </div>

        <!-- Quick Demo Presets -->
        <div class="presets-row">
          <span class="presets-label">Quick Prompts:</span>
          <button (click)="loadPreset('saas')" class="preset-btn">B2B SaaS Growth</button>
          <button (click)="loadPreset('coach')" class="preset-btn">High-Ticket Coach</button>
          <button (click)="loadPreset('ecom')" class="preset-btn">eCommerce Brand</button>
        </div>

        <div class="wizard-footer">
          <button (click)="generateFunnel()" class="btn-generate" [disabled]="!isValid()">
            <i class="pi pi-bolt"></i>
            <span>Generate High-Converting Funnel →</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="wizard-card loading-card" *ngIf="loading">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
        <h3>Architecting Your High-Converting Sales Funnel</h3>
        <p class="loading-sub">
          Genkit & Gemini are structuring your multi-step sequence, writing direct-response copy, formulating irresistible hooks, and designing order bumps...
        </p>
        <div class="progress-steps">
          <div class="prog-item active"><i class="pi pi-check"></i> Analyzing Target Niche & Buyer Psychology</div>
          <div class="prog-item active"><i class="pi pi-check"></i> Constructing 4-Step Funnel Framework</div>
          <div class="prog-item active"><i class="pi pi-spin pi-spinner"></i> Writing Persuasive Headlines & Copy</div>
          <div class="prog-item"><i class="pi pi-clock"></i> Packaging Fast-Action Order Bump</div>
        </div>
      </div>

      <!-- Step 2: Generated Funnel Preview -->
      <div class="wizard-card preview-card" *ngIf="generatedResult && !loading">
        <div class="preview-header">
          <div>
            <span class="preview-badge">AI ARCHITECT RESULT</span>
            <h2>{{ generatedResult.title }}</h2>
            <p class="preview-niche">Niche: <strong>{{ generatedResult.targetNiche }}</strong> · {{ generatedResult.valueProposition }}</p>
          </div>
          <div class="preview-header-actions">
            <button (click)="reset()" class="btn-secondary">
              <i class="pi pi-refresh"></i>
              <span>Start Over</span>
            </button>
            <button (click)="createFunnel()" class="btn-create-funnel" [disabled]="creating">
              <i class="pi pi-check-circle"></i>
              <span>{{ creating ? 'Creating Funnel...' : 'Create Funnel & Open in Builder →' }}</span>
            </button>
          </div>
        </div>

        <div class="strategy-summary">
          <div class="summary-item">
            <i class="pi pi-dollar"></i>
            <div>
              <strong>Pricing Strategy:</strong>
              <span>{{ generatedResult.recommendedPricingStrategy }}</span>
            </div>
          </div>
          <div class="summary-item" *ngIf="generatedResult.conversionTactics?.length">
            <i class="pi pi-bolt"></i>
            <div>
              <strong>Conversion Tactics:</strong>
              <span>{{ generatedResult.conversionTactics.join(' · ') }}</span>
            </div>
          </div>
        </div>

        <!-- Funnel Steps Preview -->
        <h4 class="steps-heading">Generated Step Sequence ({{ generatedResult.steps.length }} Steps)</h4>
        <div class="generated-steps-list">
          <div class="generated-step-item" *ngFor="let step of generatedResult.steps; let idx = index">
            <div class="step-badge-indicator">
              <span class="step-num">{{ idx + 1 }}</span>
              <span class="step-type">{{ step.stepType }}</span>
            </div>

            <div class="step-content-preview">
              <h4 class="step-headline">{{ step.headline }}</h4>
              <p class="step-subheadline">{{ step.subheadline }}</p>

              <div class="step-benefits-list" *ngIf="step.keyBenefits?.length">
                <div class="b-item" *ngFor="let b of step.keyBenefits">
                  <i class="pi pi-check"></i>
                  <span>{{ b }}</span>
                </div>
              </div>

              <!-- Order bump highlight -->
              <div class="preview-bump-box" *ngIf="step.orderBump">
                <span class="bump-tag">ORDER BUMP</span>
                <strong>{{ step.orderBump.title }} (+\${{ step.orderBump.price }})</strong>
                <p>{{ step.orderBump.description }}</p>
              </div>

              <div class="step-cta-preview">
                <i class="pi pi-arrow-right"></i>
                <span>CTA Button: <strong>"{{ step.callToAction }}"</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wizard-container {
      max-width: 950px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .wizard-header {
      text-align: center;
    }

    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
      border: 1px solid rgba(99, 102, 241, 0.25);
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .wizard-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
    }

    .wizard-subtitle {
      color: #64748b;
      font-size: 1.05rem;
      max-width: 650px;
      margin: 0 auto;
    }

    .wizard-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 2.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .full-width {
      grid-column: span 2;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
      }
    }

    .form-input {
      padding: 0.8rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
      }
    }

    .presets-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .presets-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }

    .preset-btn {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #334155;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background: #e2e8f0;
      }
    }

    .wizard-footer {
      display: flex;
      justify-content: flex-end;
    }

    .btn-generate {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      border: none;
      padding: 1rem 2rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 1.05rem;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
      transition: all 0.2s;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(79, 70, 229, 0.5);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    /* Loading state */
    .loading-card {
      text-align: center;
      padding: 4rem 2rem;
    }

    .loading-spinner {
      font-size: 3rem;
      color: #4f46e5;
      margin-bottom: 1.5rem;
    }

    .loading-sub {
      color: #64748b;
      max-width: 550px;
      margin: 0 auto 2.5rem auto;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .progress-steps {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 450px;
      margin: 0 auto;
      text-align: left;
    }

    .prog-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.9rem;
      color: #94a3b8;

      &.active {
        color: #0f172a;
        font-weight: 600;

        i { color: #10b981; }
      }
    }

    /* Preview State */
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 1.5rem;
      gap: 1rem;
    }

    .preview-badge {
      font-size: 0.7rem;
      font-weight: 700;
      color: #10b981;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .preview-header h2 {
      margin: 0.25rem 0 0.5rem 0;
      font-size: 1.6rem;
      font-weight: 800;
    }

    .preview-niche {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .preview-header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-create-funnel {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);

      &:hover:not(:disabled) {
        background: #059669;
      }
    }

    .strategy-summary {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .summary-item {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: 0.9rem;
      color: #334155;

      i { color: #6366f1; margin-top: 2px; }
    }

    .steps-heading {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .generated-steps-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .generated-step-item {
      display: flex;
      gap: 1.25rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
    }

    .step-badge-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }

    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #4f46e5;
      color: #ffffff;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-type {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .step-content-preview {
      flex: 1;
    }

    .step-headline {
      margin: 0 0 0.35rem 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }

    .step-subheadline {
      margin: 0 0 0.75rem 0;
      color: #475569;
      font-size: 0.9rem;
    }

    .step-benefits-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 0.75rem;
    }

    .b-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #334155;
      i { color: #10b981; font-size: 0.8rem; }
    }

    .preview-bump-box {
      background: #fffbeb;
      border: 1px dashed #f59e0b;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.75rem;

      .bump-tag {
        background: #dc2626;
        color: #ffffff;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 2px 5px;
        border-radius: 4px;
        margin-right: 0.5rem;
      }

      p { margin: 0.25rem 0 0 0; font-size: 0.8rem; color: #78350f; }
    }

    .step-cta-preview {
      font-size: 0.85rem;
      color: #4f46e5;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
  `],
})
export class AiFunnelWizardComponent {
  private readonly aiService = inject(AiService);
  private readonly funnelService = inject(FunnelService);
  private readonly router = inject(Router);

  formData = {
    productName: '',
    niche: '',
    offerType: 'Lead Magnet & Core Offer',
    targetAudience: '',
    pricePoint: '$97',
    keyBenefits: '',
  };

  loading = false;
  creating = false;
  generatedResult: GeneratedFunnelResult | null = null;

  isValid(): boolean {
    return !!(
      this.formData.productName.trim() &&
      this.formData.niche.trim() &&
      this.formData.targetAudience.trim() &&
      this.formData.keyBenefits.trim()
    );
  }

  loadPreset(type: 'saas' | 'coach' | 'ecom') {
    if (type === 'saas') {
      this.formData = {
        productName: 'LeadPulse AI Agent',
        niche: 'B2B Growth & Lead Gen',
        offerType: 'Lead Magnet & Core Offer',
        targetAudience: 'SaaS founders & revenue teams struggling with customer churn',
        pricePoint: '$197/mo',
        keyBenefits: 'Autonomous AI lead discovery and qualification engine that books 30+ qualified sales calls every month.',
      };
    } else if (type === 'coach') {
      this.formData = {
        productName: 'High-Ticket Authority Mastermind',
        niche: 'Consulting & Coaching',
        offerType: 'High-Ticket Application',
        targetAudience: 'Expert service providers and boutique agencies selling over $3,000 packages',
        pricePoint: '$3,500',
        keyBenefits: 'Systematic client acquisition framework that turns cold social visitors into committed high-paying clients in 14 days.',
      };
    } else {
      this.formData = {
        productName: 'Titanium Chef Cookware Set',
        niche: 'Culinary & Home eCommerce',
        offerType: 'eCommerce Flash Sale',
        targetAudience: 'Home cooks and food enthusiasts looking for chef-grade non-stick cookware',
        pricePoint: '$149',
        keyBenefits: 'Indestructible ceramic-titanium surface that never scratches, heats 40% faster, and cleans in 10 seconds.',
      };
    }
  }

  generateFunnel() {
    if (!this.isValid()) return;
    this.loading = true;

    this.aiService.generateFunnel(this.formData).subscribe({
      next: (res) => {
        this.generatedResult = res;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  createFunnel() {
    if (!this.generatedResult) return;
    this.creating = true;

    const newFunnel: Partial<Funnel> = {
      name: this.generatedResult.title,
      slug: this.generatedResult.slug || 'ai-funnel-' + Date.now().toString().slice(-4),
      category: this.generatedResult.category || 'sales',
      targetAudience: this.generatedResult.targetNiche,
      pricePoint: this.formData.pricePoint,
      status: 'published',
      steps: this.generatedResult.steps.map((s, idx) => ({
        id: `step-${idx + 1}`,
        name: s.name,
        slug: s.slug || `step-${idx + 1}`,
        stepType: s.stepType,
        order: idx,
        elements: s.elements || [],
        stats: { visitors: 0, conversions: 0, conversionRate: 0, revenue: 0 },
        settings: {
          orderBump: s.orderBump
            ? {
                enabled: true,
                title: s.orderBump.title,
                price: s.orderBump.price,
                description: s.orderBump.description,
              }
            : undefined,
        },
      })),
    };

    this.funnelService.create(newFunnel).subscribe({
      next: (created) => {
        this.creating = false;
        const id = created.id || created._id;
        this.router.navigate(['/funnels', id, 'builder']);
      },
      error: () => (this.creating = false),
    });
  }

  reset() {
    this.generatedResult = null;
  }
}
