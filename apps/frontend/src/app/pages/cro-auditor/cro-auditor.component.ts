import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FunnelService } from '../../core/services/funnel.service';
import { AiService } from '../../core/services/ai.service';
import { Funnel, FunnelStep, CroAuditResult } from '@kfunnels/shared';

@Component({
  selector: 'app-cro-auditor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cro-container animate-fadein">
      <div class="page-header">
        <div class="ai-badge">
          <i class="pi pi-search-plus"></i>
          <span>CONVERSION RATE OPTIMIZER (CRO)</span>
        </div>
        <h1 class="page-title">AI Conversion Rate Auditor</h1>
        <p class="page-subtitle">
          Diagnose conversion bottlenecks, eliminate buyer friction, and simulate high-impact A/B split tests with Gemini.
        </p>
      </div>

      <div class="cro-grid">
        <!-- Configuration Card -->
        <div class="config-card">
          <h3 class="card-title">Select Funnel Page To Audit</h3>

          <div class="form-group">
            <label>Choose Funnel</label>
            <select [(ngModel)]="selectedFunnelId" (change)="onFunnelChange()" class="form-input">
              <option value="">-- Custom Manual Input --</option>
              <option *ngFor="let f of funnels" [value]="f.id || f._id">{{ f.name }}</option>
            </select>
          </div>

          <div class="form-group" *ngIf="availableSteps.length > 0">
            <label>Choose Funnel Step</label>
            <select [(ngModel)]="selectedStepId" (change)="onStepChange()" class="form-input">
              <option *ngFor="let s of availableSteps" [value]="s.id">{{ s.name }} ({{ s.stepType }})</option>
            </select>
          </div>

          <div class="form-group">
            <label>Page Title</label>
            <input type="text" [(ngModel)]="pageTitle" class="form-input" placeholder="e.g. Masterclass VSL Landing Page" />
          </div>

          <div class="form-group">
            <label>Page Type</label>
            <select [(ngModel)]="pageType" class="form-input">
              <option value="optin">Opt-in (Lead Capture)</option>
              <option value="sales">Sales Presentation (VSL)</option>
              <option value="checkout">Checkout & Order Bump</option>
              <option value="upsell">One-Time Offer Upsell</option>
            </select>
          </div>

          <button (click)="runAudit()" class="btn-audit" [disabled]="loading || !pageTitle">
            <i class="pi pi-bolt"></i>
            <span>{{ loading ? 'Running Audit Diagnostics...' : 'Run AI CRO Audit' }}</span>
          </button>
        </div>

        <!-- Audit Report Dashboard -->
        <div class="report-card">
          <div *ngIf="!report && !loading" class="empty-report">
            <i class="pi pi-chart-pie empty-icon"></i>
            <h4>No Page Audited Yet</h4>
            <p>Select one of your sales funnels on the left or enter a custom title to evaluate conversion potential.</p>
          </div>

          <div *ngIf="loading" class="loading-report">
            <i class="pi pi-spin pi-spinner"></i>
            <h4>Scanning Page Elements & Psychology</h4>
            <p>Calculating headline hook strength, urgency velocity, cognitive load, and friction points...</p>
          </div>

          <div *ngIf="report && !loading" class="report-content">
            <!-- Overall Score Card -->
            <div class="score-banner" [ngClass]="getScoreClass(report.overallScore)">
              <div class="score-dial">
                <span class="score-number">{{ report.overallScore }}</span>
                <span class="score-max">/ 100</span>
              </div>
              <div class="score-summary">
                <h3>{{ getScoreTitle(report.overallScore) }}</h3>
                <p>{{ report.headlineCritique }}</p>
              </div>
            </div>

            <!-- Subscores Grid -->
            <div class="subscores-grid">
              <div class="subscore-card">
                <span class="sub-label">Clarity Hook</span>
                <span class="sub-val">{{ report.scoreBreakdown?.clarity }}%</span>
              </div>
              <div class="subscore-card">
                <span class="sub-label">Urgency & Scarcity</span>
                <span class="sub-val">{{ report.scoreBreakdown?.urgency }}%</span>
              </div>
              <div class="subscore-card">
                <span class="sub-label">Social Proof</span>
                <span class="sub-val">{{ report.scoreBreakdown?.socialProof }}%</span>
              </div>
              <div class="subscore-card">
                <span class="sub-label">CTA Power</span>
                <span class="sub-val">{{ report.scoreBreakdown?.ctaPower }}%</span>
              </div>
            </div>

            <!-- Critical Weaknesses -->
            <div class="weaknesses-card" *ngIf="report.criticalWeaknesses?.length">
              <h5><i class="pi pi-exclamation-triangle"></i> Critical Conversion Friction Points</h5>
              <ul>
                <li *ngFor="let w of report.criticalWeaknesses">{{ w }}</li>
              </ul>
            </div>

            <!-- Actionable Recommendations -->
            <div class="actionable-card" *ngIf="report.actionableRecommendations?.length">
              <h5><i class="pi pi-check-circle"></i> High-Leverage Fixes (Expected +15-30% Lift)</h5>
              <ul>
                <li *ngFor="let r of report.actionableRecommendations">{{ r }}</li>
              </ul>
            </div>

            <!-- A/B Test Variant Hypotheses -->
            <div class="ab-section" *ngIf="report.suggestedABTestVariants?.length">
              <h5>Recommended Split Test Experiments</h5>
              <div class="ab-experiment-card" *ngFor="let test of report.suggestedABTestVariants">
                <div class="test-header">
                  <span class="element-tag">{{ test.elementType }}</span>
                  <span class="concept-label">{{ test.originalConcept }}</span>
                </div>
                <div class="variants-row">
                  <div class="variant-col a">
                    <span class="v-tag">Variant A (Curiosity)</span>
                    <p>{{ test.variantA }}</p>
                  </div>
                  <div class="variant-col b">
                    <span class="v-tag">Variant B (Direct Benefit)</span>
                    <p>{{ test.variantB }}</p>
                  </div>
                </div>
                <div class="hypothesis-row">
                  <strong>Hypothesis:</strong> {{ test.hypothesis }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cro-container {
      max-width: 1250px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .page-header {
      text-align: center;
    }

    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    }

    .page-subtitle {
      color: #64748b;
      font-size: 1.05rem;
      max-width: 650px;
      margin: 0 auto;
    }

    .cro-grid {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 1.5rem;
      align-items: flex-start;
    }

    @media (max-width: 950px) {
      .cro-grid {
        grid-template-columns: 1fr;
      }
    }

    .config-card, .report-card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 1.75rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .card-title {
      margin: 0 0 1.25rem 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;

      label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
      }
    }

    .form-input {
      padding: 0.7rem 0.9rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.9rem;
      outline: none;

      &:focus {
        border-color: #10b981;
      }
    }

    .btn-audit {
      width: 100%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      border: none;
      padding: 0.85rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      margin-top: 0.5rem;

      &:hover:not(:disabled) {
        opacity: 0.95;
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .empty-report, .loading-report {
      text-align: center;
      padding: 5rem 1rem;
      color: #94a3b8;

      .empty-icon { font-size: 3rem; margin-bottom: 1rem; color: #cbd5e1; }
      i { font-size: 2.5rem; color: #10b981; margin-bottom: 1rem; }
      h4 { margin: 0 0 0.5rem 0; color: #334155; }
      p { margin: 0; font-size: 0.875rem; max-width: 450px; margin: 0 auto; }
    }

    .report-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .score-banner {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      border-radius: 12px;
      padding: 1.5rem;

      &.high {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        .score-dial { background: #10b981; }
        h3 { color: #065f46; }
        p { color: #047857; }
      }
      &.medium {
        background: #fffbeb;
        border: 1px solid #fde68a;
        .score-dial { background: #f59e0b; }
        h3 { color: #92400e; }
        p { color: #b45309; }
      }
      &.low {
        background: #fef2f2;
        border: 1px solid #fecaca;
        .score-dial { background: #ef4444; }
        h3 { color: #991b1b; }
        p { color: #b91c1c; }
      }
    }

    .score-dial {
      width: 85px;
      height: 85px;
      border-radius: 50%;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .score-number { font-size: 1.85rem; font-weight: 800; line-height: 1; }
      .score-max { font-size: 0.7rem; opacity: 0.85; }
    }

    .score-summary {
      flex: 1;
      h3 { margin: 0 0 0.25rem 0; font-size: 1.25rem; font-weight: 800; }
      p { margin: 0; font-size: 0.9rem; line-height: 1.5; }
    }

    .subscores-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .subscore-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      align-items: center;

      .sub-label { font-size: 0.75rem; color: #64748b; font-weight: 600; }
      .sub-val { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 3px; }
    }

    .weaknesses-card {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      border-radius: 10px;
      padding: 1.25rem;

      h5 { margin: 0 0 0.5rem 0; color: #9f1239; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; }
      ul { margin: 0; padding-left: 1.25rem; color: #be123c; font-size: 0.85rem; }
      li { margin-bottom: 0.35rem; }
    }

    .actionable-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 1.25rem;

      h5 { margin: 0 0 0.5rem 0; color: #166534; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; }
      ul { margin: 0; padding-left: 1.25rem; color: #15803d; font-size: 0.85rem; }
      li { margin-bottom: 0.35rem; }
    }

    .ab-section {
      h5 { margin: 0 0 0.75rem 0; font-size: 1rem; font-weight: 700; }
    }

    .ab-experiment-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .test-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
    }

    .element-tag {
      background: #e0e7ff;
      color: #4f46e5;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .concept-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }

    .variants-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .variant-col {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.75rem;

      .v-tag { font-size: 0.7rem; font-weight: 700; color: #475569; display: block; margin-bottom: 0.25rem; }
      p { margin: 0; font-size: 0.85rem; font-weight: 600; color: #0f172a; }
    }

    .hypothesis-row {
      font-size: 0.8rem;
      color: #475569;
    }
  `],
})
export class CroAuditorComponent implements OnInit {
  private readonly funnelService = inject(FunnelService);
  private readonly aiService = inject(AiService);

  funnels: Funnel[] = [];
  selectedFunnelId = '';
  selectedStepId = '';
  availableSteps: FunnelStep[] = [];

  pageTitle = 'Masterclass Lead & Sales Page';
  pageType: 'optin' | 'sales' | 'checkout' | 'upsell' = 'optin';

  loading = false;
  report: CroAuditResult | null = null;

  ngOnInit() {
    this.funnelService.getAll().subscribe({
      next: (f) => (this.funnels = f),
    });
  }

  onFunnelChange() {
    const f = this.funnels.find((item) => (item.id || item._id) === this.selectedFunnelId);
    if (f && f.steps && f.steps.length > 0) {
      this.availableSteps = f.steps;
      this.selectedStepId = f.steps[0].id;
      this.onStepChange();
    } else {
      this.availableSteps = [];
      this.selectedStepId = '';
    }
  }

  onStepChange() {
    const s = this.availableSteps.find((item) => item.id === this.selectedStepId);
    if (s) {
      this.pageTitle = s.name;
      this.pageType = s.stepType as any;
    }
  }

  runAudit() {
    this.loading = true;
    this.aiService
      .auditPage({
        pageTitle: this.pageTitle,
        pageType: this.pageType,
        elements: [],
      })
      .subscribe({
        next: (res) => {
          this.report = res;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  getScoreTitle(score: number): string {
    if (score >= 80) return 'High-Converting Baseline';
    if (score >= 60) return 'Moderate Conversion Friction';
    return 'Severe Conversion Roadblocks';
  }
}
