import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../core/services/orders.service';
import { FunnelService } from '../../core/services/funnel.service';
import { Order, Funnel } from '@kfunnels/shared';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="orders-page animate-fadein">
      <div class="page-header">
        <div>
          <h1 class="page-title">Orders & Transactions</h1>
          <p class="page-subtitle">Customer purchases, order bump add-ons, and sales volume.</p>
        </div>
        <div class="header-actions">
          <button (click)="exportCSV()" class="btn-secondary" [disabled]="!orders.length">
            <i class="pi pi-file-export"></i>
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      <!-- Quick Revenue Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-title">Total Processed</span>
          <span class="stat-number text-success">\${{ totalRevenue | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-title">Total Orders</span>
          <span class="stat-number">{{ orders.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-title">Order Bump Take-Rate</span>
          <span class="stat-number">{{ bumpTakeRate }}%</span>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="table-card">
        <div class="table-responsive" *ngIf="orders.length > 0; else noOrders">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product & Items</th>
                <th>Order Bumps</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ord of orders">
                <td>
                  <div class="customer-info">
                    <span class="font-semibold">{{ ord.customerName }}</span>
                    <span class="customer-email">{{ ord.customerEmail }}</span>
                  </div>
                </td>
                <td class="font-medium">{{ ord.productTitle }}</td>
                <td>
                  <span class="badge-pill badge-webinar" *ngIf="hasBump(ord)">
                    <i class="pi pi-check"></i> Bump Included
                  </span>
                  <span class="text-muted" *ngIf="!hasBump(ord)">—</span>
                </td>
                <td class="font-bold text-success">\${{ ord.amount | number:'1.2-2' }}</td>
                <td>
                  <span class="badge-pill badge-published">{{ ord.status }}</span>
                </td>
                <td class="text-muted">{{ ord.createdAt | date:'mediumDate' }}</td>
                <td class="text-right">
                  <button (click)="deleteOrder(ord)" class="btn-delete" title="Delete Order">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noOrders>
          <div class="empty-state">
            <i class="pi pi-dollar empty-icon"></i>
            <h4>No Transactions Yet</h4>
            <p>Orders completed on your checkout pages will automatically appear here with full itemization.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .orders-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
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

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      .stat-title { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
      .stat-number { font-size: 1.85rem; font-weight: 800; color: #0f172a; }
    }

    .text-success { color: #16a34a; }

    .table-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        padding: 0.85rem 1.25rem;
        background: #f8fafc;
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.9rem;
      }

      tr:hover td {
        background: #f8fafc;
      }
    }

    .customer-info {
      display: flex;
      flex-direction: column;
    }

    .customer-email {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .btn-delete {
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      color: #94a3b8;
      cursor: pointer;

      &:hover {
        background: #fee2e2;
        color: #dc2626;
      }
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: #f8fafc;
      }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: #94a3b8;

      .empty-icon { font-size: 3rem; margin-bottom: 1rem; color: #cbd5e1; }
      h4 { margin: 0 0 0.5rem 0; color: #0f172a; }
      p { margin: 0; }
    }
  `],
})
export class OrdersComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly funnelService = inject(FunnelService);

  orders: Order[] = [];
  funnels: Funnel[] = [];

  ngOnInit() {
    this.funnelService.getAll().subscribe({
      next: (f) => (this.funnels = f),
    });
    this.loadOrders();
  }

  loadOrders() {
    this.ordersService.getAll().subscribe({
      next: (o) => (this.orders = o),
    });
  }

  get totalRevenue(): number {
    return this.orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  }

  get bumpTakeRate(): number {
    if (!this.orders.length) return 0;
    const bumpOrders = this.orders.filter((o) => this.hasBump(o)).length;
    return Number(((bumpOrders / this.orders.length) * 100).toFixed(0));
  }

  hasBump(order: Order): boolean {
    return (order.items || []).some((i) => i.type === 'bump');
  }

  deleteOrder(order: Order) {
    const id = order.id || order._id;
    if (!id) return;
    if (confirm(`Delete transaction for ${order.customerEmail}?`)) {
      this.ordersService.delete(id).subscribe({
        next: () => this.loadOrders(),
      });
    }
  }

  exportCSV() {
    const headers = ['Customer Name', 'Email', 'Product', 'Amount', 'Status', 'Date'];
    const rows = this.orders.map((o) => [
      `"${o.customerName}"`,
      `"${o.customerEmail}"`,
      `"${o.productTitle}"`,
      `"${o.amount}"`,
      `"${o.status}"`,
      `"${o.createdAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kfunnels_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
