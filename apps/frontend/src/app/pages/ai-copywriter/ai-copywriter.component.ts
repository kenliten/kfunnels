import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../core/services/ai.service';
import { CopywriterResult } from '@kfunnels/shared';

@Component({
  selector: 'app-ai-copywriter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="copywriter-container animate-fadein">
      <div class="page-header">
        <div class="ai-badge">
          <i class="pi pi-sparkles"></i>
          <span>DIRECT-RESPONSE COPYWRITING STUDIO</span>
        </div>
        <h1 class="page-title">Direct-Response AI Copywriter</h1>
        <p class="page-subtitle">
          Craft hypnotic headlines, fascinating bullet points, and high-converting CTAs using proven frameworks (AIDA, PAS, BAB).
        </p>
      </div>

      <div class="studio-grid">
        <!-- Input Form -->
        <div class="input-card">
          <h3 class="card-title">Campaign Parameters</h3>

          <div class="form-group">
            <label>Copywriting Framework</label>
            <div class="framework-selector">
              <div
                class="framework-opt"
                [class.active]="formData.framework === 'AIDA'"
                (click)="formData.framework = 'AIDA'"
              >
                <strong>AIDA</strong>
                <span>Attention · Interest · Desire · Action</span>
              </div>
              <div
                class="framework-opt"
                [class.active]="formData.framework === 'PAS'"
                (click)="formData.framework = 'PAS'"
              >
                <strong>PAS</strong>
                <span>Problem · Agitate · Solve</span>
              </div>
              <div
                class="framework-opt"
                [class.active]="formData.framework === 'BAB'"
                (click)="formData.framework = 'BAB'"
              >
                <strong>BAB</strong>
                <span>Before · After · Bridge</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Funnel Section Focus</label>
            <select [(ngModel)]="formData.sectionType" class="form-input">
              <option value="Main Landing Page Headline Hook">Main Landing Page Headline Hook</option>
              <option value="Video Sales Letter (VSL) Lead">Video Sales Letter (VSL) Lead</option>
              <option value="Irresistible Value Bullets">Irresistible Value Bullets & Fascinations</option>
              <option value="Checkout Order Bump Copy">Checkout Order Bump Copy</option>
              <option value="High-Friction CTA Button">High-Urgency CTA Button</option>
            </select>
          </div>

          <div class="form-group">
            <label>Product or Offer Name</label>
            <input
              type="text"
              [(ngModel)]="formData.productName"
              placeholder="e.g. Omnichannel Growth Blueprint"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Target Audience</label>
            <input
              type="text"
              [(ngModel)]="formData.targetAudience"
              placeholder="e.g. Course creators who struggle with low webinar show-up rates"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Core Benefit / Big Promise</label>
            <input
              type="text"
              [(ngModel)]="formData.keyBenefit"
              placeholder="e.g. 85% show-up rate and predictable $10k launches"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Brand Tone</label>
            <select [(ngModel)]="formData.tone" class="form-input">
              <option value="Authoritative & Direct">Authoritative & Direct</option>
              <option value="High Energy & Urgent">High Energy & Urgent</option>
              <option value="Empathetic & Transformational">Empathetic & Transformational</option>
              <option value="Scientific & Proof-Driven">Scientific & Proof-Driven</option>
            </select>
          </div>

          <button (click)="generateCopy()" class="btn-generate" [disabled]="loading || !isValid()">
            <i class="pi pi-bolt"></i>
            <span>{{ loading ? 'Generating Copy...' : 'Generate High-Converting Copy' }}</span>
          </button>
        </div>

        <!-- Output Results -->
        <div class="results-card">
          <div *ngIf="!result && !loading" class="empty-results">
            <i class="pi pi-pencil empty-icon"></i>
            <h4>Ready to Craft Direct-Response Copy</h4>
            <p>Select your framework and click generate to produce headline hooks, fascinations, and rationale.</p>
          </div>

          <div *ngIf="loading" class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Gemini is applying the {{ formData.framework }} direct-response framework...</p>
          </div>

          <div *ngIf="result && !loading" class="result-content">
            <div class="result-header">
              <span class="badge-pill badge-lead">{{ formData.framework }} FRAMEWORK</span>
              <span class="copied-badge" *ngIf="copiedText">Copied to clipboard!</span>
            </div>

            <!-- Headline Variants -->
            <div class="result-block">
              <h5>Headline Hook Variants</h5>
              <div class="copy-box" *ngFor="let h of result.headlineVariants">
                <p>{{ h }}</p>
                <button (click)="copy(h)" class="btn-copy" title="Copy to Clipboard">
                  <i class="pi pi-copy"></i>
                </button>
              </div>
            </div>

            <!-- Subheadlines -->
            <div class="result-block" *ngIf="result.subheadlines?.length">
              <h5>Subheadlines</h5>
              <div class="copy-box" *ngFor="let s of result.subheadlines">
                <p>{{ s }}</p>
                <button (click)="copy(s)" class="btn-copy">
                  <i class="pi pi-copy"></i>
                </button>
              </div>
            </div>

            <!-- Bullet Points -->
            <div class="result-block" *ngIf="result.bulletPoints?.length">
              <h5>Fascinations & Benefits</h5>
              <div class="bullets-card">
                <div class="b-row" *ngFor="let b of result.bulletPoints">
                  <i class="pi pi-check-circle"></i>
                  <span>{{ b }}</span>
                </div>
              </div>
            </div>

            <!-- Call to action -->
            <div class="result-block" *ngIf="result.callToAction">
              <h5>Call to Action Button</h5>
              <div class="cta-preview-box">
                <span class="cta-text">{{ result.callToAction }}</span>
                <button (click)="copy(result.callToAction)" class="btn-copy-cta">Copy CTA</button>
              </div>
            </div>

            <!-- Strategy Rationale -->
            <div class="rationale-box" *ngIf="result.directResponseRationale">
              <div class="rationale-title"><i class="pi pi-lightbulb"></i> Strategic Rationale</div>
              <p>{{ result.directResponseRationale }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .copywriter-container {
      max-width: 1200px;
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
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
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

    .studio-grid {
      display: grid;
      grid-template-columns: 460px 1fr;
      gap: 1.5rem;
      align-items: flex-start;
    }

    @media (max-width: 950px) {
      .studio-grid {
        grid-template-columns: 1fr;
      }
    }

    .input-card, .results-card {
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
        border-color: #4f46e5;
      }
    }

    .framework-selector {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .framework-opt {
      border: 1px solid #e2e8f0;
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      transition: all 0.2s;

      strong { font-size: 0.85rem; color: #0f172a; }
      span { font-size: 0.725rem; color: #64748b; }

      &:hover {
        background: #f8fafc;
      }

      &.active {
        border-color: #4f46e5;
        background: #f5f3ff;
        strong { color: #4f46e5; }
      }
    }

    .btn-generate {
      width: 100%;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
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

    .empty-results {
      text-align: center;
      padding: 5rem 1rem;
      color: #94a3b8;

      .empty-icon { font-size: 3rem; margin-bottom: 1rem; color: #cbd5e1; }
      h4 { margin: 0 0 0.5rem 0; color: #334155; }
      p { margin: 0; font-size: 0.875rem; }
    }

    .loading-state {
      text-align: center;
      padding: 5rem 1rem;
      color: #4f46e5;
      i { font-size: 2.5rem; margin-bottom: 1rem; }
      p { color: #64748b; font-size: 0.9rem; }
    }

    .result-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .copied-badge {
      font-size: 0.75rem;
      color: #10b981;
      font-weight: 700;
    }

    .result-block {
      h5 {
        margin: 0 0 0.6rem 0;
        font-size: 0.85rem;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    }

    .copy-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;

      p {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: #0f172a;
        line-height: 1.4;
      }
    }

    .btn-copy {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        background: #0f172a;
        color: #ffffff;
      }
    }

    .bullets-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .b-row {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: 0.9rem;
      color: #1e293b;

      i { color: #10b981; font-size: 1rem; margin-top: 2px; }
    }

    .cta-preview-box {
      background: #10b981;
      border-radius: 8px;
      padding: 0.75rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
    }

    .cta-text {
      font-weight: 700;
      font-size: 1.05rem;
    }

    .btn-copy-cta {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.75rem;
      cursor: pointer;

      &:hover {
        background: #ffffff;
        color: #10b981;
      }
    }

    .rationale-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 1rem;
      font-size: 0.85rem;
      color: #166534;

      .rationale-title {
        font-weight: 700;
        margin-bottom: 0.35rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      p { margin: 0; line-height: 1.5; }
    }
  `],
})
export class AiCopywriterComponent {
  private readonly aiService = inject(AiService);

  formData = {
    framework: 'AIDA' as 'AIDA' | 'PAS' | 'BAB',
    sectionType: 'Main Landing Page Headline Hook',
    productName: 'Conversion Rocket AI',
    targetAudience: 'Agency owners & funnel builders looking for higher ROAS',
    keyBenefit: 'Triples conversion rates with psychological objection-disarming copy',
    tone: 'Authoritative & Direct',
  };

  loading = false;
  result: CopywriterResult | null = null;
  copiedText = false;

  isValid(): boolean {
    return !!(this.formData.productName && this.formData.keyBenefit);
  }

  generateCopy() {
    this.loading = true;
    this.copiedText = false;

    this.aiService.generateCopy(this.formData).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
    this.copiedText = true;
    setTimeout(() => (this.copiedText = false), 2500);
  }
}
