import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { FunnelService } from '../../core/services/funnel.service';
import { DashboardMetrics, Funnel } from '@kfunnels/shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page animate-fadein">
      <!-- Welcome & Action Header -->
      <div class="header-section">
        <div>
          <h1 class="page-title">Growth Dashboard</h1>
          <p class="page-subtitle">Real-time performance across all sales funnels and AI workflows.</p>
        </div>
        <div class="action-buttons">
          <button (click)="seedTemplates()" class="btn-secondary" [disabled]="seeding">
            <i class="pi pi-download"></i>
            <span>{{ seeding ? 'Loading Templates...' : 'Seed Templates' }}</span>
          </button>
          <a routerLink="/ai-wizard" class="btn-primary">
            <i class="pi pi-sparkles"></i>
            <span>AI Funnel Generator</span>
          </a>
        </div>
      </div>

      <!-- High Level Metric Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Total Revenue</span>
            <div class="metric-icon revenue">
              <i class="pi pi-dollar"></i>
            </div>
          </div>
          <div class="metric-value">\${{ (metrics?.totalRevenue || 0) | number:'1.0-0' }}</div>
          <div class="metric-footer positive">
            <i class="pi pi-arrow-up-right"></i>
            <span>Direct sales + order bumps</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Total Visitors</span>
            <div class="metric-icon visitors">
              <i class="pi pi-eye"></i>
            </div>
          </div>
          <div class="metric-value">{{ (metrics?.totalVisitors || 0) | number }}</div>
          <div class="metric-footer neutral">
            <span>Tracked page impressions</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Opt-In Leads</span>
            <div class="metric-icon leads">
              <i class="pi pi-users"></i>
            </div>
          </div>
          <div class="metric-value">{{ (metrics?.totalLeads || 0) | number }}</div>
          <div class="metric-footer positive">
            <i class="pi pi-arrow-up-right"></i>
            <span>Active subscriber pipeline</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Avg Conversion Rate</span>
            <div class="metric-icon rate">
              <i class="pi pi-percentage"></i>
            </div>
          </div>
          <div class="metric-value">{{ (metrics?.avgConversionRate || 0) }}%</div>
          <div class="metric-footer positive">
            <i class="pi pi-bolt"></i>
            <span>Russell Brunson target: >20%</span>
          </div>
        </div>
      </div>

      <!-- AI Banner Callout -->
      <div class="ai-hero-banner">
        <div class="ai-banner-content">
          <div class="ai-badge">
            <i class="pi pi-sparkles"></i>
            <span>GENKIT + GEMINI ENGINE</span>
          </div>
          <h2>Design & Launch a Full Funnel In Under 60 Seconds</h2>
          <p>
            Feed your product idea, audience, and price point into the Genkit direct-response architect.
            Gemini creates the optin hook, VSL copy, checkout bump, and thank you sequence automatically.
          </p>
          <div class="banner-cta">
            <a routerLink="/ai-wizard" class="btn-banner-primary">
              <i class="pi pi-bolt"></i>
              <span>Launch AI Funnel Wizard →</span>
            </a>
            <a routerLink="/ai-copywriter" class="btn-banner-secondary">
              <i class="pi pi-pencil"></i>
              <span>AIDA / PAS Copywriter</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Active Funnels Section -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title-wrap">
            <h3 class="section-title">Active Sales Funnels</h3>
            <span class="count-badge">{{ funnels.length }} funnels</span>
          </div>
          <a routerLink="/funnels" class="link-view-all">
            <span>View All Funnels</span>
            <i class="pi pi-arrow-right"></i>
          </a>
        </div>

        <div class="table-responsive" *ngIf="funnels.length > 0; else noFunnels">
          <table class="data-table">
            <thead>
              <tr>
                <th>Funnel Name</th>
                <th>Category</th>
                <th>Steps</th>
                <th>Visitors</th>
                <th>Revenue</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let funnel of funnels">
                <td>
                  <div class="funnel-name-col">
                    <span class="font-semibold">{{ funnel.name }}</span>
                    <span class="funnel-slug">/f/{{ funnel.slug }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge-pill badge-{{ funnel.category }}">{{ funnel.category }}</span>
                </td>
                <td>{{ funnel.steps?.length || 0 }} steps</td>
                <td>{{ (funnel.stats?.totalVisitors || 0) | number }}</td>
                <td class="font-bold text-success">\${{ (funnel.stats?.totalRevenue || 0) | number:'1.0-0' }}</td>
                <td>
                  <span class="badge-pill" [ngClass]="funnel.status === 'published' ? 'badge-published' : 'badge-draft'">
                    {{ funnel.status }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="action-row">
                    <a [routerLink]="['/funnels', funnel.id || funnel._id, 'builder']" class="btn-table-action" title="Open Visual Builder">
                      <i class="pi pi-pencil"></i>
                      <span>Edit</span>
                    </a>
                    <a [routerLink]="['/f', funnel.slug]" target="_blank" class="btn-table-action preview" title="View Public Funnel">
                      <i class="pi pi-external-link"></i>
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noFunnels>
          <div class="empty-state">
            <i class="pi pi-filter empty-icon"></i>
            <h4>No Funnels Created Yet</h4>
            <p>Seed the pre-built direct response templates or generate a brand new funnel with AI.</p>
            <div class="empty-actions">
              <button (click)="seedTemplates()" class="btn-secondary" [disabled]="seeding">
                <i class="pi pi-download"></i>
                <span>Load Pre-Built Funnels</span>
              </button>
              <a routerLink="/ai-wizard" class="btn-primary">
                <i class="pi pi-sparkles"></i>
                <span>Generate With AI</span>
              </a>
            </div>
          </div>
        </ng-template>
      </div>

      <!-- Recent Leads & Orders Split Grid -->
      <div class="split-grid">
        <!-- Recent Leads -->
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">Recent Opt-In Leads</h3>
            <a routerLink="/contacts" class="link-view-all">View All</a>
          </div>
          <div *ngIf="metrics?.recentLeads?.length; else noRecentLeads">
            <div class="mini-list">
              <div class="mini-item" *ngFor="let lead of metrics?.recentLeads">
                <div class="lead-avatar">
                  {{ lead.name.charAt(0) || 'U' }}
                </div>
                <div class="lead-info">
                  <div class="font-medium">{{ lead.name }}</div>
                  <div class="text-muted">{{ lead.email }}</div>
                </div>
                <div class="lead-tag">
                  <span class="badge-pill badge-lead">Opt-in</span>
                </div>
              </div>
            </div>
          </div>
          <ng-template #noRecentLeads>
            <p class="text-muted text-center py-4">No leads captured yet. Send visitors to your optin pages!</p>
          </ng-template>
        </div>

        <!-- Recent Transactions -->
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">Recent Transactions</h3>
            <a routerLink="/orders" class="link-view-all">View All</a>
          </div>
          <div *ngIf="metrics?.recentOrders?.length; else noRecentOrders">
            <div class="mini-list">
              <div class="mini-item" *ngFor="let order of metrics?.recentOrders">
                <div class="order-avatar">
                  <i class="pi pi-check"></i>
                </div>
                <div class="lead-info">
                  <div class="font-medium">{{ order.productTitle }}</div>
                  <div class="text-muted">{{ order.customerEmail }}</div>
                </div>
                <div class="font-bold text-success">
                  +\${{ order.amount }}
                </div>
              </div>
            </div>
          </div>
          <ng-template #noRecentOrders>
            <p class="text-muted text-center py-4">No orders placed yet. Test your checkout flow!</p>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .header-section {
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
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      color: #64748b;
      margin: 0;
      font-size: 1rem;
    }

    .action-buttons {
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
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      cursor: pointer;
      border: none;
      transition: all 0.2s;

      &:hover {
        background: #4338ca;
        transform: translateY(-1px);
      }
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f8fafc;
        border-color: #94a3b8;
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .metric-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .metric-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;

      &.revenue { background: #dcfce7; color: #16a34a; }
      &.visitors { background: #e0e7ff; color: #4f46e5; }
      &.leads { background: #fef3c7; color: #d97706; }
      &.rate { background: #f3e8ff; color: #9333ea; }
    }

    .metric-value {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }

    .metric-footer {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      color: #64748b;

      &.positive {
        color: #16a34a;
        font-weight: 600;
      }
    }

    .ai-hero-banner {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      border-radius: 16px;
      padding: 2.5rem;
      color: #ffffff;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(49, 46, 129, 0.35);

      &::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -10%;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(255, 255, 255, 0) 70%);
        border-radius: 50%;
      }
    }

    .ai-banner-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
    }

    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }

    .ai-hero-banner h2 {
      font-size: 1.85rem;
      font-weight: 800;
      margin: 0 0 0.75rem 0;
      letter-spacing: -0.02em;
    }

    .ai-hero-banner p {
      font-size: 1.05rem;
      color: #cbd5e1;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .banner-cta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn-banner-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #10b981;
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      transition: all 0.2s;

      &:hover {
        background: #059669;
        transform: translateY(-1px);
      }
    }

    .btn-banner-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    .section-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .count-badge {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .link-view-all {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: #4f46e5;
      font-size: 0.875rem;
      font-weight: 600;

      &:hover {
        text-decoration: underline;
      }
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        padding: 0.75rem 1rem;
        background: #f8fafc;
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        padding: 1rem;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.9rem;
      }

      tr:hover td {
        background: #f8fafc;
      }
    }

    .funnel-name-col {
      display: flex;
      flex-direction: column;
    }

    .funnel-slug {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .text-success {
      color: #16a34a;
    }

    .action-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .btn-table-action {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #f1f5f9;
      color: #334155;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;

      &:hover {
        background: #e2e8f0;
        color: #0f172a;
      }

      &.preview {
        padding: 0.4rem 0.5rem;
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;

      .empty-icon {
        font-size: 3rem;
        color: #cbd5e1;
        margin-bottom: 1rem;
      }

      h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        color: #0f172a;
      }

      p {
        color: #64748b;
        max-width: 450px;
        margin: 0 auto 1.5rem auto;
      }

      .empty-actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
      }
    }

    .split-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .mini-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .mini-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border-radius: 8px;
      background: #f8fafc;
      gap: 1rem;
    }

    .lead-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e0e7ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .order-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #dcfce7;
      color: #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lead-info {
      flex: 1;
    }

    .text-muted {
      color: #64748b;
      font-size: 0.8rem;
    }

    .py-4 {
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly funnelService = inject(FunnelService);

  metrics: DashboardMetrics | null = null;
  funnels: Funnel[] = [];
  seeding = false;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.analyticsService.getDashboardMetrics().subscribe({
      next: (m) => (this.metrics = m),
      error: (e) => console.error(e),
    });

    this.funnelService.getAll().subscribe({
      next: (f) => (this.funnels = f),
      error: (e) => console.error(e),
    });
  }

  seedTemplates() {
    this.seeding = true;
    this.funnelService.seedTemplates().subscribe({
      next: () => {
        this.seeding = false;
        this.loadData();
      },
      error: () => {
        this.seeding = false;
        this.loadData();
      },
    });
  }
}
