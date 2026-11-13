import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FunnelService } from '../../core/services/funnel.service';
import { LeadsService } from '../../core/services/leads.service';
import { OrdersService } from '../../core/services/orders.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Funnel, FunnelStep, PageElement, OrderItem } from '@kfunnels/shared';

@Component({
  selector: 'app-public-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div
      class="public-page"
      *ngIf="funnel && currentStep"
      [style.backgroundColor]="funnel.theme?.backgroundColor || '#ffffff'"
      [style.color]="funnel.theme?.textColor || '#0f172a'"
      [style.fontFamily]="funnel.theme?.fontFamily || 'Inter, sans-serif'"
    >
      <!-- Public Page Top Banner Preview Notice -->
      <div class="public-preview-banner">
        <span>⚡ Live Funnel Page: <strong>{{ funnel.name }}</strong> ({{ currentStep.name }})</span>
        <a [routerLink]="['/funnels', funnel.id || funnel._id, 'builder']" class="back-link">
          <i class="pi pi-pencil"></i>
          <span>Open In Editor</span>
        </a>
      </div>

      <!-- Main Step Container -->
      <div class="public-container">
        <!-- Render Elements -->
        <div class="public-elements-wrapper">
          <div *ngFor="let elem of currentStep.elements" class="elem-wrapper" [ngStyle]="getElementStyles(elem)">
            <!-- Headline -->
            <h1 *ngIf="elem.type === 'headline'" class="pub-headline">
              {{ elem.content?.text }}
            </h1>

            <!-- Subheadline -->
            <h3 *ngIf="elem.type === 'subheadline'" class="pub-subheadline">
              {{ elem.content?.text }}
            </h3>

            <!-- Paragraph -->
            <p *ngIf="elem.type === 'paragraph'" class="pub-paragraph">
              {{ elem.content?.text }}
            </p>

            <!-- Bullet list -->
            <div *ngIf="elem.type === 'bullet-list'" class="pub-bullets">
              <div class="bullet-row" *ngFor="let item of elem.content?.items">
                <i class="pi pi-check-circle check-icon"></i>
                <span>{{ item }}</span>
              </div>
            </div>

            <!-- Video Player -->
            <div *ngIf="elem.type === 'video-player'" class="pub-video-wrap">
              <div class="video-ratio">
                <iframe
                  [src]="getSafeVideoUrl(elem.content?.videoUrl)"
                  frameborder="0"
                  allowfullscreen
                  class="video-frame"
                ></iframe>
              </div>
            </div>

            <!-- Opt-In Lead Form -->
            <div *ngIf="elem.type === 'optin-form'" class="pub-optin-card">
              <form (submit)="submitOptin($event, elem)">
                <div class="form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    [(ngModel)]="optinName"
                    name="name"
                    [placeholder]="elem.content?.placeholderName || 'Your Name'"
                    required
                  />
                </div>
                <div class="form-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    [(ngModel)]="optinEmail"
                    name="email"
                    [placeholder]="elem.content?.placeholderEmail || 'your@email.com'"
                    required
                  />
                </div>
                <button type="submit" class="pub-submit-btn" [disabled]="submitting">
                  {{ submitting ? 'Processing...' : (elem.content?.buttonText || 'Get Instant Access →') }}
                </button>
                <p class="pub-privacy" *ngIf="elem.content?.privacyNote">
                  {{ elem.content?.privacyNote }}
                </p>
              </form>
            </div>

            <!-- Checkout Order Form -->
            <div *ngIf="elem.type === 'checkout-form'" class="pub-checkout-card">
              <form (submit)="submitOrder($event, elem)">
                <div class="checkout-summary-header">
                  <h4>{{ elem.content?.productName || funnel.name }}</h4>
                  <div class="price-tag">\${{ elem.content?.price || 97 }}</div>
                </div>

                <!-- Order Bump Selection Box -->
                <div class="pub-order-bump-box" *ngIf="elem.content?.orderBump">
                  <div class="bump-select-row">
                    <input
                      type="checkbox"
                      id="opt-bump"
                      [(ngModel)]="includeOrderBump"
                      name="includeOrderBump"
                    />
                    <label for="opt-bump">
                      <span class="bump-pill">ONE-TIME OFFER</span>
                      <strong>{{ elem.content.orderBump?.title }} (+\${{ elem.content.orderBump?.price }})</strong>
                    </label>
                  </div>
                  <p class="bump-text">{{ elem.content.orderBump?.description }}</p>
                </div>

                <div class="checkout-fields">
                  <div class="form-field">
                    <label>Full Name</label>
                    <input type="text" [(ngModel)]="orderCustomerName" name="customerName" required placeholder="John Doe" />
                  </div>
                  <div class="form-field">
                    <label>Email Address</label>
                    <input type="email" [(ngModel)]="orderCustomerEmail" name="customerEmail" required placeholder="john@example.com" />
                  </div>
                  <div class="form-field">
                    <label>Credit Card Number (Demo / Sandbox)</label>
                    <input type="text" value="•••• •••• •••• 4242" disabled />
                  </div>
                </div>

                <div class="order-total-bar">
                  <span>Total Amount:</span>
                  <strong>\${{ calculateTotal(elem.content) }}</strong>
                </div>

                <button type="submit" class="pub-checkout-btn" [disabled]="submitting">
                  {{ submitting ? 'Authorizing Payment...' : (elem.content?.buttonText || 'Complete Order 🔒') }}
                </button>
              </form>
            </div>

            <!-- Call To Action Button -->
            <div *ngIf="elem.type === 'button'" class="pub-btn-center">
              <button (click)="goToNextStep()" class="pub-cta-button" [ngStyle]="getElementStyles(elem)">
                {{ elem.content?.text }}
              </button>
            </div>

            <!-- Guarantee Box -->
            <div *ngIf="elem.type === 'guarantee-box'" class="pub-guarantee-card">
              <div class="guarantee-icon"><i class="pi pi-shield"></i></div>
              <div>
                <h4>{{ elem.content?.title }}</h4>
                <p>{{ elem.content?.text }}</p>
              </div>
            </div>

            <!-- Badge -->
            <div *ngIf="elem.type === 'badge'" class="pub-badge-center">
              <span class="pub-badge-pill">{{ elem.content?.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .public-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .public-preview-banner {
      background: #0f172a;
      color: #94a3b8;
      padding: 0.5rem 1.5rem;
      font-size: 0.8rem;
      display: flex;
      justify-content: space-between;
      align-items: center;

      strong { color: #f8fafc; }
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: #818cf8;
      font-weight: 600;

      &:hover {
        color: #ffffff;
      }
    }

    .public-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 1.5rem 5rem 1.5rem;
      width: 100%;
    }

    .public-elements-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .elem-wrapper {
      width: 100%;
    }

    .pub-headline {
      margin: 0;
      font-size: 2.75rem;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .pub-subheadline {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 400;
      line-height: 1.5;
      color: #475569;
    }

    .pub-paragraph {
      margin: 0;
      font-size: 1.1rem;
      line-height: 1.7;
    }

    .pub-bullets {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin: 0.5rem 0;
    }

    .bullet-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 1.1rem;

      .check-icon {
        color: #10b981;
        font-size: 1.25rem;
        margin-top: 3px;
      }
    }

    .pub-video-wrap {
      width: 100%;
      margin: 1rem 0;
    }

    .video-ratio {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .video-frame {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
    }

    .pub-optin-card, .pub-checkout-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 2.25rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      max-width: 580px;
      margin: 0 auto;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.25rem;

      label { font-size: 0.85rem; font-weight: 600; color: #334155; }
      input {
        padding: 0.85rem 1rem;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        font-size: 1rem;
        outline: none;

        &:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }
      }
    }

    .pub-submit-btn, .pub-checkout-btn {
      width: 100%;
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 1.1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1.15rem;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #059669;
        transform: translateY(-1px);
      }
    }

    .pub-privacy {
      font-size: 0.8rem;
      color: #64748b;
      text-align: center;
      margin: 0.75rem 0 0 0;
    }

    .checkout-summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
      margin-bottom: 1.25rem;

      h4 { margin: 0; font-size: 1.25rem; }
      .price-tag { font-size: 1.6rem; font-weight: 800; color: #16a34a; }
    }

    .pub-order-bump-box {
      background: #fffbeb;
      border: 2px dashed #f59e0b;
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .bump-select-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.35rem;

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
      }
    }

    .bump-pill {
      background: #dc2626;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 0.5rem;
    }

    .bump-text {
      margin: 0;
      font-size: 0.85rem;
      color: #78350f;
    }

    .order-total-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-top: 1px solid #e2e8f0;
      margin-bottom: 1rem;
      font-size: 1.15rem;

      strong { font-size: 1.5rem; color: #0f172a; }
    }

    .pub-btn-center {
      display: flex;
      justify-content: center;
    }

    .pub-cta-button {
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .pub-guarantee-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 650px;
      margin: 0 auto;

      .guarantee-icon {
        font-size: 2.75rem;
        color: #10b981;
      }

      h4 { margin: 0 0 0.25rem 0; font-size: 1.15rem; }
      p { margin: 0; font-size: 0.9rem; color: #64748b; line-height: 1.5; }
    }

    .pub-badge-center {
      display: flex;
      justify-content: center;
    }

    .pub-badge-pill {
      background: rgba(99, 102, 241, 0.12);
      color: #4f46e5;
      padding: 6px 18px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
    }
  `],
})
export class PublicViewerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly funnelService = inject(FunnelService);
  private readonly leadsService = inject(LeadsService);
  private readonly ordersService = inject(OrdersService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly sanitizer = inject(DomSanitizer);

  getSafeVideoUrl(url?: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url || 'about:blank');
  }

  funnel: Funnel | null = null;
  currentStep: FunnelStep | null = null;
  submitting = false;

  // Opt-in form models
  optinName = '';
  optinEmail = '';

  // Checkout form models
  orderCustomerName = '';
  orderCustomerEmail = '';
  includeOrderBump = false;

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      const stepSlug = params.get('stepSlug');

      if (slug) {
        this.funnelService.getBySlug(slug).subscribe({
          next: (f) => {
            this.funnel = f;
            if (stepSlug && f.steps) {
              this.currentStep =
                f.steps.find((s) => s.slug === stepSlug) || f.steps[0];
            } else if (f.steps && f.steps.length > 0) {
              this.currentStep = f.steps[0];
            }

            // Track page view in analytics
            const funnelId = f.id || f._id;
            if (funnelId) {
              this.analyticsService
                .trackView(funnelId, this.currentStep?.id)
                .subscribe();
            }
          },
          error: (e) => console.error(e),
        });
      }
    });
  }

  getElementStyles(elem: PageElement) {
    const s = elem.styles || {};
    return {
      'background-color': s.backgroundColor || 'transparent',
      color: s.textColor || 'inherit',
      padding: s.padding || '0',
      margin: s.margin || '0',
      'text-align': s.textAlign || 'inherit',
      'font-size': s.fontSize || 'inherit',
      'font-weight': s.fontWeight || 'inherit',
      'border-radius': s.borderRadius || '0',
      'max-width': s.maxWidth || '100%',
    };
  }

  calculateTotal(content: any): number {
    let total = content?.price || 97;
    if (this.includeOrderBump && content?.orderBump?.price) {
      total += content.orderBump.price;
    }
    return total;
  }

  submitOptin(event: Event, elem: PageElement) {
    event.preventDefault();
    if (!this.funnel || !this.currentStep || !this.optinEmail) return;

    this.submitting = true;
    const funnelId = this.funnel.id || this.funnel._id || '';

    this.leadsService
      .create({
        funnelId,
        stepId: this.currentStep.id,
        name: this.optinName || 'Visitor',
        email: this.optinEmail,
        tags: ['optin', this.funnel.slug],
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.goToNextStep();
        },
        error: () => (this.submitting = false),
      });
  }

  submitOrder(event: Event, elem: PageElement) {
    event.preventDefault();
    if (!this.funnel || !this.currentStep || !this.orderCustomerEmail) return;

    this.submitting = true;
    const funnelId = this.funnel.id || this.funnel._id || '';
    const mainPrice = elem.content?.price || 97;
    const items: OrderItem[] = [
      {
        title: elem.content?.productName || this.funnel.name,
        price: mainPrice,
        type: 'main',
      },
    ];

    if (this.includeOrderBump && elem.content?.orderBump) {
      items.push({
        title: elem.content.orderBump.title,
        price: elem.content.orderBump.price || 27,
        type: 'bump',
      });
    }

    const totalAmount = this.calculateTotal(elem.content);

    this.ordersService
      .create({
        funnelId,
        stepId: this.currentStep.id,
        customerName: this.orderCustomerName || 'Customer',
        customerEmail: this.orderCustomerEmail,
        productTitle: elem.content?.productName || this.funnel.name,
        amount: totalAmount,
        items,
        status: 'paid',
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.goToNextStep();
        },
        error: () => (this.submitting = false),
      });
  }

  goToNextStep() {
    if (!this.funnel?.steps || !this.currentStep) return;
    const currentIdx = this.funnel.steps.findIndex(
      (s) => s.id === this.currentStep!.id
    );

    if (currentIdx !== -1 && currentIdx < this.funnel.steps.length - 1) {
      const nextStep = this.funnel.steps[currentIdx + 1];
      this.currentStep = nextStep;
      this.router.navigate(['/f', this.funnel.slug, nextStep.slug]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('🎉 Funnel sequence completed!');
    }
  }
}
