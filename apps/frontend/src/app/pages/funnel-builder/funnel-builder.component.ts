import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FunnelService } from '../../core/services/funnel.service';
import { AiService } from '../../core/services/ai.service';
import {
  Funnel,
  FunnelStep,
  PageElement,
  ElementType,
  FunnelStepType,
  CroAuditResult,
  CopywriterResult,
} from '@kfunnels/shared';

@Component({
  selector: 'app-funnel-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="builder-container" *ngIf="funnel">
      <!-- Builder Top Navigation Bar -->
      <header class="builder-topbar">
        <div class="topbar-left">
          <a routerLink="/funnels" class="btn-back" title="Back to Funnels">
            <i class="pi pi-arrow-left"></i>
          </a>
          <div class="funnel-info">
            <span class="funnel-name">{{ funnel.name }}</span>
            <span class="step-indicator">
              <i class="pi pi-chevron-right separator"></i>
              <strong>{{ currentStep?.name || 'Step' }}</strong>
              <span class="badge-pill badge-step">{{ currentStep?.stepType }}</span>
            </span>
          </div>
        </div>

        <!-- Responsive Device Mode Toggles -->
        <div class="device-toggles">
          <button
            class="device-btn"
            [class.active]="deviceMode === 'desktop'"
            (click)="deviceMode = 'desktop'"
            title="Desktop Mode"
          >
            <i class="pi pi-desktop"></i>
          </button>
          <button
            class="device-btn"
            [class.active]="deviceMode === 'tablet'"
            (click)="deviceMode = 'tablet'"
            title="Tablet Mode"
          >
            <i class="pi pi-tablet"></i>
          </button>
          <button
            class="device-btn"
            [class.active]="deviceMode === 'mobile'"
            (click)="deviceMode = 'mobile'"
            title="Mobile Mode"
          >
            <i class="pi pi-mobile"></i>
          </button>
        </div>

        <!-- Top Actions -->
        <div class="topbar-actions">
          <button (click)="openAiWriter()" class="btn-tool ai-writer">
            <i class="pi pi-sparkles"></i>
            <span>AI Copywriter</span>
          </button>
          <button (click)="openCroAudit()" class="btn-tool cro-audit">
            <i class="pi pi-search-plus"></i>
            <span>AI CRO Audit</span>
          </button>
          <button (click)="openAddElementModal()" class="btn-tool add-elem">
            <i class="pi pi-plus"></i>
            <span>Add Block</span>
          </button>
          <button (click)="saveFunnel()" class="btn-save" [disabled]="saving">
            <i class="pi pi-check"></i>
            <span>{{ saving ? 'Saving...' : 'Save Page' }}</span>
          </button>
          <a [routerLink]="['/f', funnel.slug, currentStep?.slug]" target="_blank" class="btn-preview" title="Live Preview">
            <i class="pi pi-external-link"></i>
          </a>
        </div>
      </header>

      <!-- Main Workspace -->
      <div class="builder-workspace">
        <!-- Left: Funnel Step Hierarchy -->
        <aside class="steps-sidebar">
          <div class="sidebar-header">
            <h4>Funnel Steps ({{ funnel.steps?.length || 0 }})</h4>
            <button (click)="openAddStepModal()" class="btn-add-step" title="Add Funnel Step">
              <i class="pi pi-plus"></i>
            </button>
          </div>

          <div class="steps-list">
            <div
              class="step-item"
              *ngFor="let step of funnel.steps; let idx = index"
              [class.active]="currentStep?.id === step.id"
              (click)="selectStep(step)"
            >
              <div class="step-num">{{ idx + 1 }}</div>
              <div class="step-details">
                <span class="step-title">{{ step.name }}</span>
                <span class="step-sub">{{ step.stepType }} · {{ step.elements?.length || 0 }} blocks</span>
              </div>
              <div class="step-actions" (click)="$event.stopPropagation()">
                <button (click)="moveStep(idx, -1)" [disabled]="idx === 0" class="mini-btn" title="Move Up">
                  <i class="pi pi-arrow-up"></i>
                </button>
                <button (click)="moveStep(idx, 1)" [disabled]="idx === funnel.steps.length - 1" class="mini-btn" title="Move Down">
                  <i class="pi pi-arrow-down"></i>
                </button>
                <button (click)="deleteStep(step.id)" *ngIf="funnel.steps.length > 1" class="mini-btn delete" title="Delete Step">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Step Stats Summary -->
          <div class="step-stats-box" *ngIf="currentStep">
            <div class="stats-box-title">Step Performance</div>
            <div class="stat-pair">
              <span>Visitors:</span>
              <strong>{{ currentStep.stats?.visitors || 0 }}</strong>
            </div>
            <div class="stat-pair">
              <span>Conversions:</span>
              <strong>{{ currentStep.stats?.conversions || 0 }} ({{ currentStep.stats?.conversionRate || 0 }}%)</strong>
            </div>
            <div class="stat-pair" *ngIf="currentStep.stats?.revenue">
              <span>Revenue:</span>
              <strong class="text-success">\${{ currentStep.stats?.revenue | number:'1.0-0' }}</strong>
            </div>
          </div>
        </aside>

        <!-- Center: Interactive Visual Page Canvas -->
        <section class="canvas-viewport" (click)="deselectElement()">
          <div class="canvas-frame" [ngClass]="deviceMode">
            <div
              class="canvas-content"
              [style.backgroundColor]="funnel.theme?.backgroundColor || '#ffffff'"
              [style.color]="funnel.theme?.textColor || '#0f172a'"
              [style.fontFamily]="funnel.theme?.fontFamily || 'Inter, sans-serif'"
            >
              <!-- Element List -->
              <div
                *ngFor="let elem of currentStep?.elements; let i = index"
                class="element-wrapper"
                [class.selected]="selectedElement?.id === elem.id"
                (click)="selectElement(elem, $event)"
              >
                <!-- Floating Toolbar on Selected Element -->
                <div class="element-action-toolbar" *ngIf="selectedElement?.id === elem.id" (click)="$event.stopPropagation()">
                  <span class="elem-badge">{{ elem.label || elem.type }}</span>
                  <button (click)="moveElement(i, -1)" [disabled]="i === 0" title="Move Up"><i class="pi pi-arrow-up"></i></button>
                  <button (click)="moveElement(i, 1)" [disabled]="i === (currentStep?.elements?.length || 0) - 1" title="Move Down"><i class="pi pi-arrow-down"></i></button>
                  <button (click)="duplicateElement(elem)" title="Duplicate"><i class="pi pi-copy"></i></button>
                  <button (click)="openAiWriter(elem)" title="AI Magic Rewrite"><i class="pi pi-sparkles"></i></button>
                  <button (click)="deleteElement(elem.id)" class="del" title="Delete"><i class="pi pi-trash"></i></button>
                </div>

                <!-- Render Element by Type -->
                <div [ngSwitch]="elem.type" [ngStyle]="getElementStyles(elem)">
                  <!-- Headline -->
                  <h1 *ngSwitchCase="'headline'" [style.margin]="'0'" [style.color]="elem.styles?.textColor">
                    {{ elem.content?.text }}
                  </h1>

                  <!-- Subheadline -->
                  <h3 *ngSwitchCase="'subheadline'" [style.margin]="'0'" [style.color]="elem.styles?.textColor">
                    {{ elem.content?.text }}
                  </h3>

                  <!-- Paragraph -->
                  <p *ngSwitchCase="'paragraph'" [style.margin]="'0'" [style.lineHeight]="'1.6'" [style.color]="elem.styles?.textColor">
                    {{ elem.content?.text }}
                  </p>

                  <!-- Bullet List -->
                  <div *ngSwitchCase="'bullet-list'" class="render-bullets">
                    <div class="bullet-item" *ngFor="let item of elem.content?.items">
                      <i class="pi pi-check-circle bullet-icon"></i>
                      <span>{{ item }}</span>
                    </div>
                  </div>

                  <!-- Button -->
                  <div *ngSwitchCase="'button'" class="render-btn-wrap">
                    <button class="preview-btn" [ngStyle]="getElementStyles(elem)">
                      {{ elem.content?.text }}
                    </button>
                  </div>

                  <!-- Video Player -->
                  <div *ngSwitchCase="'video-player'" class="render-video">
                    <div class="video-container">
                      <iframe
                        [src]="getSafeVideoUrl(elem.content?.videoUrl)"
                        frameborder="0"
                        allowfullscreen
                        class="video-iframe"
                      ></iframe>
                    </div>
                  </div>

                  <!-- Opt-in Form -->
                  <div *ngSwitchCase="'optin-form'" class="render-optin-form">
                    <div class="optin-form-card">
                      <div class="optin-input-group">
                        <label>Name</label>
                        <input type="text" [placeholder]="elem.content?.placeholderName || 'Your Name'" disabled />
                      </div>
                      <div class="optin-input-group">
                        <label>Email Address</label>
                        <input type="email" [placeholder]="elem.content?.placeholderEmail || 'Your Best Email'" disabled />
                      </div>
                      <button class="optin-submit-btn">
                        {{ elem.content?.buttonText || 'Claim Free Access →' }}
                      </button>
                      <p class="privacy-note" *ngIf="elem.content?.privacyNote">{{ elem.content?.privacyNote }}</p>
                    </div>
                  </div>

                  <!-- Checkout Form -->
                  <div *ngSwitchCase="'checkout-form'" class="render-checkout-form">
                    <div class="checkout-card">
                      <div class="checkout-header">
                        <h4>Order Summary</h4>
                        <span class="product-price">\${{ elem.content?.price || 97 }}</span>
                      </div>
                      <div class="checkout-product-title">{{ elem.content?.productName || 'Core Product' }}</div>

                      <!-- Order Bump Box -->
                      <div class="order-bump-box" *ngIf="elem.content?.orderBump">
                        <div class="bump-header">
                          <input type="checkbox" id="bump-check" checked disabled />
                          <label for="bump-check">
                            <span class="bump-badge">ONE TIME OFFER</span>
                            <strong>{{ elem.content.orderBump?.title }} (+\${{ elem.content.orderBump?.price }})</strong>
                          </label>
                        </div>
                        <p class="bump-desc">{{ elem.content.orderBump?.description }}</p>
                      </div>

                      <div class="dummy-inputs">
                        <input type="text" placeholder="Full Name" disabled />
                        <input type="email" placeholder="Email Address" disabled />
                        <input type="text" placeholder="Card Number (256-Bit Encrypted)" disabled />
                      </div>

                      <button class="checkout-submit-btn">
                        {{ elem.content?.buttonText || 'Complete My Order 🔒' }}
                      </button>
                    </div>
                  </div>

                  <!-- Guarantee Box -->
                  <div *ngSwitchCase="'guarantee-box'" class="render-guarantee">
                    <div class="guarantee-badge-icon">
                      <i class="pi pi-shield"></i>
                    </div>
                    <div>
                      <h4 class="guarantee-title">{{ elem.content?.title }}</h4>
                      <p class="guarantee-text">{{ elem.content?.text }}</p>
                    </div>
                  </div>

                  <!-- Badge -->
                  <div *ngSwitchCase="'badge'" class="render-badge">
                    <span class="custom-badge">{{ elem.content?.text }}</span>
                  </div>

                  <!-- Default fallback -->
                  <div *ngSwitchDefault>
                    <p>{{ elem.label || elem.type }}</p>
                  </div>
                </div>
              </div>

              <!-- Add Element Prompt in Canvas if empty -->
              <div class="empty-canvas-prompt" *ngIf="!currentStep?.elements?.length">
                <i class="pi pi-plus-circle"></i>
                <p>This step is empty. Click below to add direct-response blocks.</p>
                <button (click)="openAddElementModal()" class="btn-primary">Add Your First Block</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Right: Element Property Inspector -->
        <aside class="inspector-sidebar" *ngIf="selectedElement; else noInspector">
          <div class="inspector-header">
            <h4>Block Properties</h4>
            <span class="inspector-type">{{ selectedElement.type }}</span>
          </div>

          <div class="inspector-body">
            <!-- Content Editor -->
            <div class="prop-group" *ngIf="selectedElement.content?.text !== undefined">
              <label>Text Content</label>
              <textarea
                [(ngModel)]="selectedElement.content.text"
                rows="4"
                class="prop-input"
              ></textarea>
            </div>

            <div class="prop-group" *ngIf="selectedElement.content?.buttonText !== undefined">
              <label>Button Label</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.content.buttonText"
                class="prop-input"
              />
            </div>

            <div class="prop-group" *ngIf="selectedElement.type === 'video-player'">
              <label>Video Embed URL (YouTube/Vimeo)</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.content.videoUrl"
                class="prop-input"
              />
            </div>

            <div class="prop-group" *ngIf="selectedElement.type === 'checkout-form'">
              <label>Product Price ($)</label>
              <input
                type="number"
                [(ngModel)]="selectedElement.content.price"
                class="prop-input"
              />
            </div>

            <!-- Styles Editor -->
            <h5 class="styles-header">Design & Typography</h5>

            <div class="prop-group">
              <label>Text Alignment</label>
              <div class="align-buttons">
                <button (click)="setAlignment('left')" [class.active]="selectedElement.styles?.textAlign === 'left'"><i class="pi pi-align-left"></i></button>
                <button (click)="setAlignment('center')" [class.active]="selectedElement.styles?.textAlign === 'center'"><i class="pi pi-align-center"></i></button>
                <button (click)="setAlignment('right')" [class.active]="selectedElement.styles?.textAlign === 'right'"><i class="pi pi-align-right"></i></button>
              </div>
            </div>

            <div class="prop-group">
              <label>Font Size</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.styles!.fontSize"
                placeholder="e.g. 2.5rem or 18px"
                class="prop-input"
              />
            </div>

            <div class="prop-group">
              <label>Text Color</label>
              <div class="color-picker-row">
                <input type="color" [(ngModel)]="selectedElement.styles!.textColor" class="color-input" />
                <input type="text" [(ngModel)]="selectedElement.styles!.textColor" class="prop-input color-text" />
              </div>
            </div>

            <div class="prop-group">
              <label>Background Color</label>
              <div class="color-picker-row">
                <input type="color" [(ngModel)]="selectedElement.styles!.backgroundColor" class="color-input" />
                <input type="text" [(ngModel)]="selectedElement.styles!.backgroundColor" class="prop-input color-text" />
              </div>
            </div>

            <div class="prop-group">
              <label>Border Radius</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.styles!.borderRadius"
                placeholder="e.g. 8px or 12px"
                class="prop-input"
              />
            </div>

            <div class="prop-group">
              <label>Padding</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.styles!.padding"
                placeholder="e.g. 1rem 2rem"
                class="prop-input"
              />
            </div>

            <div class="prop-group">
              <label>Margin</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.styles!.margin"
                placeholder="e.g. 0 auto 2rem auto"
                class="prop-input"
              />
            </div>

            <div class="prop-group">
              <label>Max Width</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.styles!.maxWidth"
                placeholder="e.g. 700px or 100%"
                class="prop-input"
              />
            </div>
          </div>
        </aside>

        <ng-template #noInspector>
          <aside class="inspector-sidebar empty-inspector">
            <i class="pi pi-sliders-h"></i>
            <p>Click any element in the canvas to customize its content, copywriting, typography, and styling.</p>
          </aside>
        </ng-template>
      </div>

      <!-- Add Element Modal -->
      <div class="modal-backdrop" *ngIf="showAddElementModal" (click)="showAddElementModal = false">
        <div class="modal-card wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Conversion Block</h3>
            <button (click)="showAddElementModal = false" class="close-btn"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body blocks-grid">
            <div class="block-option" (click)="addElement('headline')">
              <div class="block-icon"><i class="pi pi-star"></i></div>
              <div class="block-info">
                <strong>Headline (Hook)</strong>
                <span>High impact H1 headline to grab immediate attention.</span>
              </div>
            </div>
            <div class="block-option" (click)="addElement('subheadline')">
              <div class="block-icon"><i class="pi pi-align-left"></i></div>
              <div class="block-info">
                <strong>Subheadline</strong>
                <span>Elaborate the hook and build curiosity.</span>
              </div>
            </div>
            <div class="block-option" (click)="addElement('video-player')">
              <div class="block-icon"><i class="pi pi-video"></i></div>
              <div class="block-info">
                <strong>VSL Video Player</strong>
                <span>Video sales letter container for presentations.</span>
              </div>
            </div>
            <div class="block-option" (click)="addElement('optin-form')">
              <div class="block-icon"><i class="pi pi-envelope"></i></div>
              <div class="block-info">
                <strong>Lead Magnet Opt-in Form</strong>
                <span>Capture visitor name & email with auto next-step.</span>
              </div>
            </div>
            <div class="block-option" (click)="addElement('checkout-form')">
              <div class="block-icon"><i class="pi pi-credit-card"></i></div>
              <div class="block-info">
                <strong>Checkout & Order Bump</strong>
                <span>Stripe-style 2-step checkout with order bump.</span>
              </div>
            </div>
            <div class="block-option" (click)="addElement('button')">
              <div class="block-icon"><i class="pi pi-external-link"></i></div>
              <div class="block-info">
                <strong>Call-To-Action Button</strong>
                <span>Vibrant button directing to checkout or next step.</span>
              </div>
            </div>
            <div class="block-option" (click)="addElement('bullet-list')">
              <div class="block-icon"><i class="pi pi-list"></i></div>
              <div class="block-info">
                <strong>Fascinations & Benefits List</strong>
                <span>Checkmark bullets highlighting irresistible value.</span>
              </div>
            </div>
            <div class="block-option" (click)="addElement('guarantee-box')">
              <div class="block-icon"><i class="pi pi-shield"></i></div>
              <div class="block-info">
                <strong>30-Day Guarantee Box</strong>
                <span>Eliminate buyer friction with risk reversal.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Step Modal -->
      <div class="modal-backdrop" *ngIf="showAddStepModal" (click)="showAddStepModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add New Funnel Step</h3>
            <button (click)="showAddStepModal = false" class="close-btn"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Step Name</label>
              <input type="text" [(ngModel)]="newStepName" placeholder="e.g. VIP One-Time Offer" class="form-input" />
            </div>
            <div class="form-group">
              <label>Step Type</label>
              <select [(ngModel)]="newStepType" class="form-input">
                <option value="optin">Opt-In (Lead Magnet)</option>
                <option value="sales">Sales Page (VSL Presentation)</option>
                <option value="checkout">Order Checkout</option>
                <option value="upsell">One-Time Offer (Upsell)</option>
                <option value="downsell">Downsell Offer</option>
                <option value="thankyou">Thank You & Access</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="showAddStepModal = false" class="btn-secondary">Cancel</button>
            <button (click)="submitAddStep()" class="btn-primary" [disabled]="!newStepName.trim()">Add Step</button>
          </div>
        </div>
      </div>

      <!-- AI Copywriter Modal -->
      <div class="modal-backdrop" *ngIf="showAiWriterModal" (click)="showAiWriterModal = false">
        <div class="modal-card wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="header-with-badge">
              <i class="pi pi-sparkles ai-icon"></i>
              <h3>AI Direct-Response Copywriter (Genkit + Gemini)</h3>
            </div>
            <button (click)="showAiWriterModal = false" class="close-btn"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="ai-input-grid">
              <div class="form-group">
                <label>Copywriting Framework</label>
                <select [(ngModel)]="aiFramework" class="form-input">
                  <option value="AIDA">AIDA (Attention, Interest, Desire, Action)</option>
                  <option value="PAS">PAS (Problem, Agitate, Solve)</option>
                  <option value="BAB">BAB (Before, After, Bridge)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Section Focus</label>
                <input type="text" [(ngModel)]="aiSectionType" placeholder="e.g. Main Headline Hook" class="form-input" />
              </div>
              <div class="form-group full-width">
                <label>Core Benefit or Big Promise</label>
                <input type="text" [(ngModel)]="aiKeyBenefit" placeholder="e.g. Scale customer acquisition 3x without ad fatigue" class="form-input" />
              </div>
            </div>

            <button (click)="runAiCopywriter()" class="btn-generate-ai" [disabled]="generatingAi">
              <i class="pi pi-bolt"></i>
              <span>{{ generatingAi ? 'Generating Persuasive Copy...' : 'Generate Copy Variants' }}</span>
            </button>

            <!-- Results -->
            <div class="ai-results" *ngIf="aiResults">
              <h5>Generated Headline Hooks</h5>
              <div class="variants-list">
                <div class="variant-item" *ngFor="let h of aiResults.headlineVariants">
                  <p>{{ h }}</p>
                  <button (click)="applyCopy(h)" class="btn-apply">Use This</button>
                </div>
              </div>

              <div class="rationale-box" *ngIf="aiResults.directResponseRationale">
                <strong>Why this converts:</strong> {{ aiResults.directResponseRationale }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI CRO Audit Drawer/Modal -->
      <div class="modal-backdrop" *ngIf="showCroAuditModal" (click)="showCroAuditModal = false">
        <div class="modal-card wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="header-with-badge">
              <i class="pi pi-search-plus cro-icon"></i>
              <h3>AI Conversion Rate Audit (CRO)</h3>
            </div>
            <button (click)="showCroAuditModal = false" class="close-btn"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div *ngIf="auditLoading" class="audit-loading">
              <i class="pi pi-spin pi-spinner"></i>
              <p>Analyzing copy clarity, headline hook, friction points, and urgency triggers...</p>
            </div>

            <div *ngIf="auditResult && !auditLoading" class="audit-dashboard">
              <div class="audit-score-card">
                <div class="score-circle">
                  <span class="score-num">{{ auditResult.overallScore }}</span>
                  <span class="score-label">/ 100</span>
                </div>
                <div class="score-text">
                  <h4>{{ auditResult.overallScore >= 80 ? 'Strong Conversion Foundation' : 'Optimization Needed' }}</h4>
                  <p>{{ auditResult.headlineCritique }}</p>
                </div>
              </div>

              <div class="breakdown-grid">
                <div class="breakdown-item">
                  <span>Clarity:</span>
                  <strong>{{ auditResult.scoreBreakdown?.clarity }}%</strong>
                </div>
                <div class="breakdown-item">
                  <span>Urgency:</span>
                  <strong>{{ auditResult.scoreBreakdown?.urgency }}%</strong>
                </div>
                <div class="breakdown-item">
                  <span>Social Proof:</span>
                  <strong>{{ auditResult.scoreBreakdown?.socialProof }}%</strong>
                </div>
                <div class="breakdown-item">
                  <span>CTA Power:</span>
                  <strong>{{ auditResult.scoreBreakdown?.ctaPower }}%</strong>
                </div>
              </div>

              <div class="recommendations-box">
                <h5>Actionable CRO Recommendations</h5>
                <ul>
                  <li *ngFor="let rec of auditResult.actionableRecommendations">{{ rec }}</li>
                </ul>
              </div>

              <div class="ab-tests-box" *ngIf="auditResult.suggestedABTestVariants?.length">
                <h5>Suggested High-Impact A/B Tests</h5>
                <div class="ab-card" *ngFor="let test of auditResult.suggestedABTestVariants">
                  <div class="ab-title">Test: {{ test.elementType }}</div>
                  <div class="ab-variants">
                    <div class="variant a"><strong>Variant A:</strong> {{ test.variantA }}</div>
                    <div class="variant b"><strong>Variant B:</strong> {{ test.variantB }}</div>
                  </div>
                  <p class="hypothesis"><strong>Hypothesis:</strong> {{ test.hypothesis }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .builder-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 68px);
      margin: -2rem;
      background: #f1f5f9;
      overflow: hidden;
    }

    .builder-topbar {
      height: 58px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.25rem;
      z-index: 50;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-back {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e2e8f0;

      &:hover {
        background: #e2e8f0;
        color: #0f172a;
      }
    }

    .funnel-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .funnel-name {
      color: #64748b;
      font-weight: 500;
    }

    .separator {
      font-size: 0.75rem;
      color: #cbd5e1;
      margin: 0 0.25rem;
    }

    .badge-step {
      background: #e0e7ff;
      color: #4f46e5;
      margin-left: 0.5rem;
    }

    .device-toggles {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      gap: 2px;
    }

    .device-btn {
      background: transparent;
      border: none;
      width: 34px;
      height: 30px;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;

      &:hover {
        color: #0f172a;
      }

      &.active {
        background: #ffffff;
        color: #4f46e5;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-tool {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      border-radius: 7px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;

      &.ai-writer {
        background: rgba(99, 102, 241, 0.1);
        color: #4f46e5;
        border-color: rgba(99, 102, 241, 0.25);
        &:hover { background: rgba(99, 102, 241, 0.18); }
      }

      &.cro-audit {
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
        border-color: rgba(16, 185, 129, 0.25);
        &:hover { background: rgba(16, 185, 129, 0.18); }
      }

      &.add-elem {
        background: #f8fafc;
        color: #334155;
        border-color: #cbd5e1;
        &:hover { background: #e2e8f0; }
      }
    }

    .btn-save {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 0.45rem 1rem;
      border-radius: 7px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background: #4338ca;
      }
    }

    .btn-preview {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 7px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;

      &:hover {
        background: #e2e8f0;
        color: #0f172a;
      }
    }

    .builder-workspace {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Left Steps Sidebar */
    .steps-sidebar {
      width: 260px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;

      h4 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 700;
        color: #334155;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    }

    .btn-add-step {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: #f1f5f9;
      border: none;
      color: #475569;
      cursor: pointer;

      &:hover {
        background: #4f46e5;
        color: #ffffff;
      }
    }

    .steps-list {
      flex: 1;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .step-item {
      display: flex;
      align-items: center;
      padding: 0.65rem 0.75rem;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      gap: 0.6rem;
      transition: all 0.2s;

      &:hover {
        background: #f8fafc;
      }

      &.active {
        background: #f0fdf4;
        border-color: #86efac;
      }
    }

    .step-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-item.active .step-num {
      background: #10b981;
      color: #ffffff;
    }

    .step-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .step-title {
      font-size: 0.825rem;
      font-weight: 600;
      color: #0f172a;
    }

    .step-sub {
      font-size: 0.7rem;
      color: #64748b;
      text-transform: capitalize;
    }

    .step-actions {
      display: flex;
      gap: 2px;
    }

    .mini-btn {
      background: transparent;
      border: none;
      width: 20px;
      height: 20px;
      font-size: 0.65rem;
      color: #94a3b8;
      cursor: pointer;

      &:hover:not(:disabled) {
        color: #0f172a;
      }

      &.delete:hover {
        color: #ef4444;
      }
    }

    .step-stats-box {
      margin: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      font-size: 0.8rem;
    }

    .stats-box-title {
      font-weight: 700;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .stat-pair {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    /* Center Canvas Viewport */
    .canvas-viewport {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      display: flex;
      justify-content: center;
      background: #cbd5e1;
    }

    .canvas-frame {
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      transition: width 0.3s ease;
      min-height: 100%;

      &.desktop {
        width: 100%;
        max-width: 1050px;
      }
      &.tablet {
        width: 768px;
      }
      &.mobile {
        width: 414px;
      }
    }

    .canvas-content {
      padding: 3rem 2rem;
      min-height: 800px;
      display: flex;
      flex-direction: column;
    }

    .element-wrapper {
      position: relative;
      border: 1px dashed transparent;
      padding: 0.5rem;
      border-radius: 6px;
      transition: all 0.15s;

      &:hover {
        border-color: #93c5fd;
      }

      &.selected {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.03);
      }
    }

    .element-action-toolbar {
      position: absolute;
      top: -32px;
      right: 0;
      background: #0f172a;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 3px 6px;
      z-index: 10;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);

      .elem-badge {
        font-size: 0.65rem;
        color: #94a3b8;
        padding-right: 6px;
        border-right: 1px solid #334155;
        text-transform: uppercase;
      }

      button {
        background: transparent;
        border: none;
        color: #ffffff;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        cursor: pointer;
        border-radius: 4px;

        &:hover:not(:disabled) {
          background: #334155;
        }

        &.del:hover {
          background: #dc2626;
        }
      }
    }

    /* Rendered Elements Styles */
    .render-bullets {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .bullet-item {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: 1.05rem;
    }

    .bullet-icon {
      color: #10b981;
      font-size: 1.25rem;
      margin-top: 2px;
    }

    .render-btn-wrap {
      display: flex;
      justify-content: center;
    }

    .preview-btn {
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .render-video {
      display: flex;
      justify-content: center;
    }

    .video-container {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      height: 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }

    .video-iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .optin-form-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .optin-input-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label {
        font-size: 0.85rem;
        font-weight: 600;
      }

      input {
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
      }
    }

    .optin-submit-btn, .checkout-submit-btn {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1.1rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }

    .privacy-note {
      font-size: 0.75rem;
      color: #64748b;
      text-align: center;
      margin: 0;
    }

    .checkout-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .checkout-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h4 { margin: 0; font-size: 1.2rem; }
      .product-price { font-size: 1.5rem; font-weight: 800; color: #16a34a; }
    }

    .checkout-product-title {
      font-weight: 600;
      color: #475569;
    }

    .order-bump-box {
      background: #fffbeb;
      border: 2px dashed #f59e0b;
      border-radius: 10px;
      padding: 1rem;
    }

    .bump-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.4rem;
    }

    .bump-badge {
      background: #dc2626;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 0.4rem;
    }

    .bump-desc {
      margin: 0;
      font-size: 0.825rem;
      color: #78350f;
    }

    .dummy-inputs {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      input {
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
      }
    }

    .render-guarantee {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
    }

    .guarantee-badge-icon {
      font-size: 2.5rem;
      color: #10b981;
    }

    .guarantee-title {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .guarantee-text {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .custom-badge {
      display: inline-block;
      font-weight: 700;
    }

    .empty-canvas-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 1rem;
      text-align: center;
      color: #94a3b8;

      i { font-size: 3rem; margin-bottom: 1rem; }
      p { margin: 0 0 1.5rem 0; font-size: 1.1rem; }
    }

    /* Right Property Inspector */
    .inspector-sidebar {
      width: 320px;
      background: #ffffff;
      border-left: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .inspector-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h4 { margin: 0; font-size: 0.95rem; font-weight: 700; }
    }

    .inspector-type {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    .inspector-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .styles-header {
      margin: 0.5rem 0 0 0;
      padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.85rem;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .prop-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
      }
    }

    .prop-input {
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 0.85rem;
      outline: none;

      &:focus {
        border-color: #4f46e5;
      }
    }

    .align-buttons {
      display: flex;
      gap: 0.25rem;

      button {
        flex: 1;
        padding: 0.4rem;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        cursor: pointer;

        &.active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }
      }
    }

    .color-picker-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .color-input {
      width: 36px;
      height: 36px;
      padding: 0;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      cursor: pointer;
    }

    .color-text {
      flex: 1;
    }

    .empty-inspector {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
      color: #94a3b8;

      i { font-size: 2.5rem; margin-bottom: 1rem; }
      p { margin: 0; font-size: 0.875rem; line-height: 1.5; }
    }

    /* Modals & Drawers */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-card {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      overflow: hidden;

      &.wide {
        max-width: 720px;
      }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;

      h3 { margin: 0; font-size: 1.2rem; font-weight: 700; }
    }

    .header-with-badge {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .ai-icon { color: #6366f1; font-size: 1.25rem; }
    .cro-icon { color: #10b981; font-size: 1.25rem; }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
      max-height: 75vh;
      overflow-y: auto;
    }

    .blocks-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .block-option {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #4f46e5;
        background: #f8fafc;
        transform: translateY(-1px);
      }
    }

    .block-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #e0e7ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .block-info {
      display: flex;
      flex-direction: column;
      strong { font-size: 0.85rem; color: #0f172a; margin-bottom: 2px; }
      span { font-size: 0.75rem; color: #64748b; line-height: 1.4; }
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-secondary {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    /* AI Copywriter Modal Specific */
    .ai-input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .full-width {
      grid-column: span 2;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    }

    .form-input {
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.875rem;
      outline: none;
    }

    .btn-generate-ai {
      width: 100%;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      border: none;
      padding: 0.85rem;
      border-radius: 8px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      margin-bottom: 1.5rem;
    }

    .variants-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .variant-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;

      p { margin: 0; font-size: 0.9rem; font-weight: 500; }
    }

    .btn-apply {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .rationale-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      color: #166534;
    }

    /* CRO Audit Modal */
    .audit-loading {
      text-align: center;
      padding: 3rem 1rem;
      i { font-size: 2.5rem; color: #10b981; margin-bottom: 1rem; }
    }

    .audit-score-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 1.25rem;
    }

    .score-circle {
      width: 75px;
      height: 75px;
      border-radius: 50%;
      background: #10b981;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .score-num { font-size: 1.6rem; font-weight: 800; line-height: 1; }
      .score-label { font-size: 0.65rem; }
    }

    .score-text {
      flex: 1;
      h4 { margin: 0 0 0.25rem 0; font-size: 1.1rem; }
      p { margin: 0; font-size: 0.85rem; color: #64748b; }
    }

    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .breakdown-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.75rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      span { font-size: 0.75rem; color: #64748b; }
      strong { font-size: 1.1rem; color: #0f172a; margin-top: 2px; }
    }

    .recommendations-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 1.25rem;

      h5 { margin: 0 0 0.5rem 0; color: #92400e; font-size: 0.9rem; }
      ul { margin: 0; padding-left: 1.25rem; color: #78350f; font-size: 0.85rem; }
      li { margin-bottom: 0.25rem; }
    }

    .ab-tests-box {
      h5 { margin: 0 0 0.75rem 0; font-size: 0.95rem; }
    }

    .ab-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;
      margin-bottom: 0.75rem;
    }

    .ab-title { font-weight: 700; font-size: 0.85rem; color: #4f46e5; margin-bottom: 0.4rem; text-transform: uppercase; }
    .ab-variants { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.825rem; margin-bottom: 0.4rem; }
    .hypothesis { margin: 0; font-size: 0.75rem; color: #64748b; }
  `],
})
export class FunnelBuilderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly funnelService = inject(FunnelService);
  private readonly aiService = inject(AiService);
  private readonly sanitizer = inject(DomSanitizer);

  getSafeVideoUrl(url?: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url || 'about:blank');
  }

  funnel: Funnel | null = null;
  currentStep: FunnelStep | null = null;
  selectedElement: PageElement | null = null;
  deviceMode: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  saving = false;

  // Add Step Modal
  showAddStepModal = false;
  newStepName = '';
  newStepType: FunnelStepType = 'sales';

  // Add Element Modal
  showAddElementModal = false;

  // AI Copywriter Modal
  showAiWriterModal = false;
  aiFramework: 'AIDA' | 'PAS' | 'BAB' = 'AIDA';
  aiSectionType = 'Main Headline Hook';
  aiKeyBenefit = '';
  generatingAi = false;
  aiResults: CopywriterResult | null = null;
  targetElementForAi: PageElement | null = null;

  // CRO Audit Modal
  showCroAuditModal = false;
  auditLoading = false;
  auditResult: CroAuditResult | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadFunnel(id);
      }
    });
  }

  loadFunnel(id: string) {
    this.funnelService.getById(id).subscribe({
      next: (f) => {
        this.funnel = f;
        if (f.steps && f.steps.length > 0) {
          this.currentStep = f.steps[0];
          this.selectedElement = this.currentStep.elements?.[0] || null;
        }
      },
      error: (e) => console.error(e),
    });
  }

  selectStep(step: FunnelStep) {
    this.currentStep = step;
    this.selectedElement = step.elements?.[0] || null;
  }

  selectElement(elem: PageElement, event: MouseEvent) {
    event.stopPropagation();
    this.selectedElement = elem;
    if (!this.selectedElement.styles) {
      this.selectedElement.styles = {};
    }
  }

  deselectElement() {
    // Canvas click deselects
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

  setAlignment(align: 'left' | 'center' | 'right') {
    if (this.selectedElement) {
      if (!this.selectedElement.styles) this.selectedElement.styles = {};
      this.selectedElement.styles.textAlign = align;
    }
  }

  moveElement(index: number, direction: number) {
    if (!this.currentStep?.elements) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= this.currentStep.elements.length) return;

    const temp = this.currentStep.elements[index];
    this.currentStep.elements[index] = this.currentStep.elements[targetIdx];
    this.currentStep.elements[targetIdx] = temp;
  }

  duplicateElement(elem: PageElement) {
    if (!this.currentStep?.elements) return;
    const clone: PageElement = JSON.parse(JSON.stringify(elem));
    clone.id = 'elem-' + Date.now();
    this.currentStep.elements.push(clone);
    this.selectedElement = clone;
  }

  deleteElement(id: string) {
    if (!this.currentStep?.elements) return;
    this.currentStep.elements = this.currentStep.elements.filter((e) => e.id !== id);
    this.selectedElement = this.currentStep.elements[0] || null;
  }

  openAddElementModal() {
    this.showAddElementModal = true;
  }

  addElement(type: ElementType) {
    if (!this.currentStep) return;
    if (!this.currentStep.elements) this.currentStep.elements = [];

    const newElem: PageElement = {
      id: 'elem-' + Date.now(),
      type,
      label: type.toUpperCase(),
      content: this.getDefaultElementContent(type),
      styles: this.getDefaultElementStyles(type),
    };

    this.currentStep.elements.push(newElem);
    this.selectedElement = newElem;
    this.showAddElementModal = false;
  }

  private getDefaultElementContent(type: ElementType): any {
    switch (type) {
      case 'headline':
        return { text: 'New Irresistible Headline Hook', tag: 'h1' };
      case 'subheadline':
        return { text: 'Compelling subheadline that expands the offer value' };
      case 'paragraph':
        return { text: 'Direct response copy explaining the transformation.' };
      case 'video-player':
        return { videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Video Presentation' };
      case 'bullet-list':
        return { items: ['Key takeaway #1', 'High leverage benefit #2', 'Time saving framework #3'] };
      case 'optin-form':
        return { buttonText: 'Claim Free Instant Access →', placeholderName: 'Your Name', placeholderEmail: 'Your Best Email' };
      case 'checkout-form':
        return {
          productName: this.funnel?.name || 'Main Product Offer',
          price: 97,
          orderBump: { title: 'Fast-Action Templates Kit', price: 27, description: 'Save 15+ hours of setup with plug-and-play guides.' },
          buttonText: 'Complete My Order 🔒',
        };
      case 'button':
        return { text: 'Click Here To Continue →', action: 'next-step' };
      case 'guarantee-box':
        return { title: '30-Day 100% Risk-Free Guarantee', text: 'If you are not delighted within 30 days, simply contact us for a full refund.' };
      default:
        return { text: 'Block Content' };
    }
  }

  private getDefaultElementStyles(type: ElementType): any {
    switch (type) {
      case 'headline':
        return { fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', margin: '0 0 1rem 0' };
      case 'subheadline':
        return { fontSize: '1.25rem', textAlign: 'center', textColor: '#475569', margin: '0 0 2rem 0' };
      case 'button':
        return {
          backgroundColor: '#10B981',
          textColor: '#ffffff',
          padding: '1.25rem 2.5rem',
          fontSize: '1.2rem',
          fontWeight: '700',
          borderRadius: '8px',
          textAlign: 'center',
          margin: '0 auto 1.5rem auto',
        };
      case 'optin-form':
      case 'checkout-form':
        return { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', maxWidth: '580px', margin: '0 auto 2rem auto' };
      case 'video-player':
        return { maxWidth: '750px', margin: '0 auto 2rem auto' };
      default:
        return { margin: '0 0 1rem 0' };
    }
  }

  openAddStepModal() {
    this.newStepName = '';
    this.newStepType = 'sales';
    this.showAddStepModal = true;
  }

  submitAddStep() {
    if (!this.funnel || !this.newStepName.trim()) return;
    const funnelId = this.funnel.id || this.funnel._id;
    if (!funnelId) return;

    this.funnelService
      .addStep(funnelId, {
        name: this.newStepName.trim(),
        stepType: this.newStepType,
        elements: [
          {
            id: 'elem-' + Date.now(),
            type: 'headline',
            label: 'Headline',
            content: { text: `Welcome to ${this.newStepName}`, tag: 'h1' },
            styles: { fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', margin: '0 0 1rem 0' },
          },
        ],
      })
      .subscribe({
        next: (updated) => {
          this.funnel = updated;
          this.currentStep = updated.steps[updated.steps.length - 1];
          this.showAddStepModal = false;
        },
      });
  }

  moveStep(idx: number, dir: number) {
    if (!this.funnel?.steps) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= this.funnel.steps.length) return;

    const temp = this.funnel.steps[idx];
    this.funnel.steps[idx] = this.funnel.steps[targetIdx];
    this.funnel.steps[targetIdx] = temp;
  }

  deleteStep(stepId: string) {
    if (!this.funnel?.steps) return;
    const funnelId = this.funnel.id || this.funnel._id;
    if (!funnelId) return;

    if (confirm('Are you sure you want to delete this step?')) {
      this.funnelService.deleteStep(funnelId, stepId).subscribe({
        next: (updated) => {
          this.funnel = updated;
          this.currentStep = updated.steps[0] || null;
        },
      });
    }
  }

  saveFunnel() {
    if (!this.funnel) return;
    const id = this.funnel.id || this.funnel._id;
    if (!id) return;

    this.saving = true;
    this.funnelService.update(id, this.funnel).subscribe({
      next: (res) => {
        this.funnel = res;
        this.saving = false;
      },
      error: () => (this.saving = false),
    });
  }

  // AI Copywriter Modal Methods
  openAiWriter(targetElem?: PageElement) {
    this.targetElementForAi = targetElem || this.selectedElement;
    if (this.targetElementForAi?.type === 'headline') {
      this.aiSectionType = 'Main Headline Hook';
    } else if (this.targetElementForAi?.type === 'button') {
      this.aiSectionType = 'Call-To-Action Button';
    } else {
      this.aiSectionType = 'Hero Section';
    }
    this.aiKeyBenefit = this.funnel?.targetAudience ? `Transformative results for ${this.funnel.targetAudience}` : 'Compelling transformation';
    this.aiResults = null;
    this.showAiWriterModal = true;
  }

  runAiCopywriter() {
    this.generatingAi = true;
    this.aiService
      .generateCopy({
        framework: this.aiFramework,
        sectionType: this.aiSectionType,
        productName: this.funnel?.name || 'Core Product',
        targetAudience: this.funnel?.targetAudience || 'Target Prospects',
        keyBenefit: this.aiKeyBenefit,
      })
      .subscribe({
        next: (res) => {
          this.aiResults = res;
          this.generatingAi = false;
        },
        error: () => (this.generatingAi = false),
      });
  }

  applyCopy(text: string) {
    if (this.targetElementForAi && this.targetElementForAi.content) {
      this.targetElementForAi.content.text = text;
    }
    this.showAiWriterModal = false;
  }

  // CRO Audit
  openCroAudit() {
    if (!this.currentStep) return;
    this.showCroAuditModal = true;
    this.auditLoading = true;

    this.aiService
      .auditPage({
        pageTitle: this.currentStep.name,
        pageType: this.currentStep.stepType,
        elements: (this.currentStep.elements || []).map((e) => ({
          type: e.type,
          content: e.content,
        })),
      })
      .subscribe({
        next: (res) => {
          this.auditResult = res;
          this.auditLoading = false;
        },
        error: () => (this.auditLoading = false),
      });
  }
}
