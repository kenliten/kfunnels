import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FunnelService } from '../../core/services/funnel.service';
import { Funnel, FunnelCategory } from '@kfunnels/shared';

@Component({
  selector: 'app-funnels-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="funnels-page animate-fadein">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Sales Funnels</h1>
          <p class="page-subtitle">Manage, customize, and deploy your direct-response marketing funnels.</p>
        </div>
        <div class="header-actions">
          <button (click)="openCreateModal()" class="btn-primary">
            <i class="pi pi-plus"></i>
            <span>Create Blank Funnel</span>
          </button>
          <a routerLink="/ai-wizard" class="btn-ai">
            <i class="pi pi-sparkles"></i>
            <span>AI Funnel Generator</span>
          </a>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar">
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search funnels by name or description..."
            class="search-input"
          />
        </div>

        <div class="category-filters">
          <button
            class="filter-pill"
            [class.active]="selectedCategory === 'all'"
            (click)="selectedCategory = 'all'"
          >
            All Funnels
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedCategory === 'sales'"
            (click)="selectedCategory = 'sales'"
          >
            Sales
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedCategory === 'lead-gen'"
            (click)="selectedCategory = 'lead-gen'"
          >
            Lead Gen
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedCategory === 'agency'"
            (click)="selectedCategory = 'agency'"
          >
            Agency & Coaching
          </button>
          <button
            class="filter-pill"
            [class.active]="selectedCategory === 'ecommerce'"
            (click)="selectedCategory = 'ecommerce'"
          >
            eCommerce
          </button>
        </div>
      </div>

      <!-- Funnels Grid -->
      <div class="funnels-grid" *ngIf="filteredFunnels.length > 0; else noFunnels">
        <div class="funnel-card" *ngFor="let funnel of filteredFunnels">
          <div class="card-top">
            <div class="card-badges">
              <span class="badge-pill badge-{{ funnel.category }}">{{ funnel.category }}</span>
              <span class="badge-pill" [ngClass]="funnel.status === 'published' ? 'badge-published' : 'badge-draft'">
                {{ funnel.status }}
              </span>
            </div>
            <div class="card-dropdown">
              <button (click)="cloneFunnel(funnel)" class="btn-icon" title="Clone Funnel">
                <i class="pi pi-copy"></i>
              </button>
              <button (click)="deleteFunnel(funnel)" class="btn-icon delete" title="Delete Funnel">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>

          <div class="card-body">
            <h3 class="funnel-title">{{ funnel.name }}</h3>
            <p class="funnel-desc">{{ funnel.description || 'Custom sales funnel optimized for high conversions.' }}</p>

            <div class="steps-preview">
              <div class="step-badge-item" *ngFor="let step of funnel.steps; let idx = index">
                <span class="step-num">{{ idx + 1 }}</span>
                <span class="step-type">{{ step.stepType }}</span>
              </div>
            </div>

            <div class="funnel-stats-row">
              <div class="stat-col">
                <span class="stat-value">{{ (funnel.stats?.totalVisitors || 0) | number }}</span>
                <span class="stat-label">Visitors</span>
              </div>
              <div class="stat-col">
                <span class="stat-value">{{ (funnel.stats?.totalOptIns || 0) + (funnel.stats?.totalSales || 0) }}</span>
                <span class="stat-label">Conversions</span>
              </div>
              <div class="stat-col">
                <span class="stat-value text-success">\${{ (funnel.stats?.totalRevenue || 0) | number:'1.0-0' }}</span>
                <span class="stat-label">Revenue</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <a [routerLink]="['/funnels', funnel.id || funnel._id, 'builder']" class="btn-open-builder">
              <i class="pi pi-pencil"></i>
              <span>Open Visual Builder</span>
            </a>
            <a [routerLink]="['/f', funnel.slug]" target="_blank" class="btn-preview-link" title="Open Live Visitor Page">
              <i class="pi pi-external-link"></i>
            </a>
          </div>
        </div>
      </div>

      <ng-template #noFunnels>
        <div class="empty-state">
          <i class="pi pi-filter empty-icon"></i>
          <h3>No Funnels Found</h3>
          <p>No funnels match your criteria. Create a new one or load templates.</p>
          <button (click)="seed()" class="btn-secondary">Load Pre-Built Funnels</button>
        </div>
      </ng-template>

      <!-- Create Funnel Dialog Modal -->
      <div class="modal-backdrop" *ngIf="showCreateModal" (click)="showCreateModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create New Sales Funnel</h3>
            <button (click)="showCreateModal = false" class="close-btn"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Funnel Name</label>
              <input type="text" [(ngModel)]="newFunnelName" placeholder="e.g. Masterclass VSL Funnel" class="form-input" />
            </div>
            <div class="form-group">
              <label>Category</label>
              <select [(ngModel)]="newFunnelCategory" class="form-input">
                <option value="sales">Sales & Core Offer</option>
                <option value="lead-gen">Lead Generation (Opt-In)</option>
                <option value="agency">High-Ticket Agency & Coaching</option>
                <option value="ecommerce">eCommerce & Order Bump</option>
                <option value="webinar">Webinar & Training</option>
              </select>
            </div>
            <div class="form-group">
              <label>Target Audience</label>
              <input type="text" [(ngModel)]="newFunnelAudience" placeholder="e.g. Digital marketers, agency founders" class="form-input" />
            </div>
            <div class="form-group">
              <label>Target Offer Price</label>
              <input type="text" [(ngModel)]="newFunnelPrice" placeholder="e.g. $97 or $497" class="form-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="showCreateModal = false" class="btn-secondary">Cancel</button>
            <button (click)="submitCreateFunnel()" class="btn-primary" [disabled]="!newFunnelName.trim()">
              Create Funnel
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .funnels-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
      color: #64748b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #4f46e5;
      color: #ffffff;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s;

      &:hover {
        background: #4338ca;
      }
    }

    .btn-ai {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

      &:hover {
        transform: translateY(-1px);
      }
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 420px;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.6rem;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.9rem;
      outline: none;

      &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      }
    }

    .category-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-pill {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #64748b;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      &.active {
        background: #0f172a;
        color: #ffffff;
        border-color: #0f172a;
      }
    }

    .funnels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .funnel-card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;

      &:hover {
        border-color: #cbd5e1;
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      }
    }

    .card-top {
      padding: 1.25rem 1.25rem 0.75rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-badges {
      display: flex;
      gap: 0.5rem;
    }

    .card-dropdown {
      display: flex;
      gap: 0.25rem;
    }

    .btn-icon {
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;

      &:hover {
        background: #f1f5f9;
        color: #0f172a;
      }

      &.delete:hover {
        background: #fee2e2;
        color: #dc2626;
      }
    }

    .card-body {
      padding: 0 1.25rem 1.25rem 1.25rem;
      flex: 1;
    }

    .funnel-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    }

    .funnel-desc {
      color: #64748b;
      font-size: 0.85rem;
      line-height: 1.5;
      margin: 0 0 1.25rem 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .steps-preview {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }

    .step-badge-item {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #475569;

      .step-num {
        font-weight: 700;
        color: #6366f1;
      }
      .step-type {
        text-transform: capitalize;
      }
    }

    .funnel-stats-row {
      display: flex;
      background: #f8fafc;
      border-radius: 8px;
      padding: 0.75rem;
      border: 1px solid #f1f5f9;
    }

    .stat-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      &:not(:last-child) {
        border-right: 1px solid #e2e8f0;
      }
    }

    .stat-value {
      font-weight: 700;
      font-size: 1rem;
      color: #0f172a;
    }

    .stat-label {
      font-size: 0.7rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .text-success {
      color: #16a34a;
    }

    .card-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn-open-builder {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #0f172a;
      color: #ffffff;
      padding: 0.65rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s;

      &:hover {
        background: #1e293b;
      }
    }

    .btn-preview-link {
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: #f1f5f9;
      color: #475569;

      &:hover {
        background: #e2e8f0;
        color: #0f172a;
      }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      background: #ffffff;
      border-radius: 12px;
      border: 1px dashed #cbd5e1;

      .empty-icon {
        font-size: 3rem;
        color: #cbd5e1;
        margin-bottom: 1rem;
      }
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
      }
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1rem;
      color: #94a3b8;
      cursor: pointer;

      &:hover {
        color: #0f172a;
      }
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.9rem;
      outline: none;

      &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      }
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
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
  `],
})
export class FunnelsListComponent implements OnInit {
  private readonly funnelService = inject(FunnelService);

  funnels: Funnel[] = [];
  searchQuery = '';
  selectedCategory: string = 'all';

  showCreateModal = false;
  newFunnelName = '';
  newFunnelCategory: FunnelCategory = 'sales';
  newFunnelAudience = '';
  newFunnelPrice = '$97';

  ngOnInit() {
    this.loadFunnels();
  }

  loadFunnels() {
    this.funnelService.getAll().subscribe({
      next: (f) => (this.funnels = f),
      error: (e) => console.error(e),
    });
  }

  get filteredFunnels(): Funnel[] {
    return this.funnels.filter((f) => {
      const matchCat =
        this.selectedCategory === 'all' || f.category === this.selectedCategory;
      const matchQuery =
        !this.searchQuery.trim() ||
        f.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }

  openCreateModal() {
    this.newFunnelName = '';
    this.showCreateModal = true;
  }

  submitCreateFunnel() {
    if (!this.newFunnelName.trim()) return;

    const newFunnel: Partial<Funnel> = {
      name: this.newFunnelName.trim(),
      category: this.newFunnelCategory,
      targetAudience: this.newFunnelAudience.trim() || 'General Audience',
      pricePoint: this.newFunnelPrice.trim() || '$97',
      status: 'draft',
      steps: [
        {
          id: 'step-1',
          name: 'Landing Optin Page',
          slug: 'optin',
          stepType: 'optin',
          order: 0,
          stats: { visitors: 0, conversions: 0, conversionRate: 0, revenue: 0 },
          elements: [
            {
              id: 'el-1',
              type: 'headline',
              label: 'Headline',
              content: { text: 'Free Training: How To Achieve Your Big Goal Fast', tag: 'h1' },
              styles: { fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', margin: '0 0 1rem 0' }
            },
            {
              id: 'el-2',
              type: 'optin-form',
              label: 'Opt-in Form',
              content: { buttonText: 'Get Instant Access →', placeholderName: 'Your Name', placeholderEmail: 'Your Email' },
              styles: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', maxWidth: '500px', margin: '0 auto' }
            }
          ]
        },
        {
          id: 'step-2',
          name: 'Core Offer Sales Page',
          slug: 'offer',
          stepType: 'sales',
          order: 1,
          stats: { visitors: 0, conversions: 0, conversionRate: 0, revenue: 0 },
          elements: [
            {
              id: 'el-3',
              type: 'headline',
              label: 'Offer Headline',
              content: { text: `Exclusive Offer: Get Access To ${this.newFunnelName}`, tag: 'h1' },
              styles: { fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', margin: '0 0 1rem 0' }
            },
            {
              id: 'el-4',
              type: 'button',
              label: 'Order Button',
              content: { text: 'Continue to Secure Checkout →', action: 'next-step' },
              styles: { backgroundColor: '#10B981', textColor: '#ffffff', padding: '1.25rem 2.5rem', fontSize: '1.25rem', borderRadius: '8px', textAlign: 'center', margin: '0 auto' }
            }
          ]
        },
        {
          id: 'step-3',
          name: 'Checkout & Order Bump',
          slug: 'checkout',
          stepType: 'checkout',
          order: 2,
          stats: { visitors: 0, conversions: 0, conversionRate: 0, revenue: 0 },
          settings: {
            orderBump: {
              enabled: true,
              title: 'Add Fast-Action Acceleration Templates For Just $27',
              price: 27,
              description: 'Save 15+ hours of setup with plug-and-play guides.'
            }
          },
          elements: [
            {
              id: 'el-5',
              type: 'checkout-form',
              label: 'Checkout Element',
              content: {
                productName: this.newFunnelName,
                price: parseFloat(this.newFunnelPrice.replace(/[^0-9.]/g, '')) || 97,
                orderBump: {
                  title: 'Add Fast-Action Acceleration Templates For Just $27',
                  price: 27,
                  description: 'Save 15+ hours of setup with plug-and-play guides.'
                },
                buttonText: 'Complete Order 🔒'
              },
              styles: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', maxWidth: '600px', margin: '0 auto' }
            }
          ]
        },
        {
          id: 'step-4',
          name: 'Confirmation & Access',
          slug: 'thankyou',
          stepType: 'thankyou',
          order: 3,
          stats: { visitors: 0, conversions: 0, conversionRate: 0, revenue: 0 },
          elements: [
            {
              id: 'el-6',
              type: 'guarantee-box',
              label: 'Confirmation Box',
              content: { title: 'Order Confirmed!', text: 'Your login credentials have been sent to your email.' },
              styles: { backgroundColor: '#ECFDF5', border: '2px solid #10B981', borderRadius: '12px', padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }
            }
          ]
        }
      ]
    };

    this.funnelService.create(newFunnel).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.loadFunnels();
      },
    });
  }

  cloneFunnel(funnel: Funnel) {
    const id = funnel.id || funnel._id;
    if (!id) return;
    this.funnelService.clone(id).subscribe({
      next: () => this.loadFunnels(),
    });
  }

  deleteFunnel(funnel: Funnel) {
    const id = funnel.id || funnel._id;
    if (!id) return;
    if (confirm(`Are you sure you want to delete "${funnel.name}"?`)) {
      this.funnelService.delete(id).subscribe({
        next: () => this.loadFunnels(),
      });
    }
  }

  seed() {
    this.funnelService.seedTemplates().subscribe({
      next: () => this.loadFunnels(),
    });
  }
}
