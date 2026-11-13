import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../../core/services/leads.service';
import { FunnelService } from '../../core/services/funnel.service';
import { Lead, Funnel } from '@kfunnels/shared';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contacts-page animate-fadein">
      <div class="page-header">
        <div>
          <h1 class="page-title">Contacts & Leads (CRM)</h1>
          <p class="page-subtitle">Subscribers and prospects captured from your opt-in funnel pages.</p>
        </div>
        <div class="header-actions">
          <button (click)="exportCSV()" class="btn-secondary" [disabled]="!leads.length">
            <i class="pi pi-file-export"></i>
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="toolbar">
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search leads by name or email..."
            class="search-input"
          />
        </div>

        <div class="funnel-filter">
          <select [(ngModel)]="selectedFunnelId" (change)="loadLeads()" class="filter-select">
            <option value="">All Funnels</option>
            <option *ngFor="let f of funnels" [value]="f.id || f._id">{{ f.name }}</option>
          </select>
        </div>
      </div>

      <!-- Leads Table -->
      <div class="table-card">
        <div class="table-responsive" *ngIf="filteredLeads.length > 0; else noLeads">
          <table class="data-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Email Address</th>
                <th>Phone</th>
                <th>Tags</th>
                <th>Date Captured</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lead of filteredLeads">
                <td>
                  <div class="contact-name-row">
                    <div class="avatar">{{ lead.name.charAt(0) || 'U' }}</div>
                    <span class="font-semibold">{{ lead.name }}</span>
                  </div>
                </td>
                <td class="font-medium">{{ lead.email }}</td>
                <td>{{ lead.phone || '—' }}</td>
                <td>
                  <div class="tags-row">
                    <span class="badge-pill badge-lead" *ngFor="let tag of lead.tags">{{ tag }}</span>
                  </div>
                </td>
                <td class="text-muted">{{ lead.createdAt | date:'mediumDate' }}</td>
                <td class="text-right">
                  <button (click)="deleteLead(lead)" class="btn-delete" title="Delete Contact">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noLeads>
          <div class="empty-state">
            <i class="pi pi-users empty-icon"></i>
            <h4>No Contacts Found</h4>
            <p>Leads captured on your opt-in pages will appear automatically here.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .contacts-page {
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

    .toolbar {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 400px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .search-input {
      width: 100%;
      padding: 0.7rem 1rem 0.7rem 2.5rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.9rem;
      outline: none;

      &:focus {
        border-color: #4f46e5;
      }
    }

    .filter-select {
      padding: 0.7rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.9rem;
      outline: none;
    }

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

    .contact-name-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #e0e7ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .tags-row {
      display: flex;
      gap: 0.35rem;
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
export class ContactsComponent implements OnInit {
  private readonly leadsService = inject(LeadsService);
  private readonly funnelService = inject(FunnelService);

  leads: Lead[] = [];
  funnels: Funnel[] = [];
  selectedFunnelId = '';
  searchQuery = '';

  ngOnInit() {
    this.funnelService.getAll().subscribe({
      next: (f) => (this.funnels = f),
    });
    this.loadLeads();
  }

  loadLeads() {
    this.leadsService.getAll(this.selectedFunnelId).subscribe({
      next: (l) => (this.leads = l),
    });
  }

  get filteredLeads(): Lead[] {
    return this.leads.filter((l) => {
      const q = this.searchQuery.toLowerCase();
      return (
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      );
    });
  }

  deleteLead(lead: Lead) {
    const id = lead.id || lead._id;
    if (!id) return;
    if (confirm(`Delete contact ${lead.email}?`)) {
      this.leadsService.delete(id).subscribe({
        next: () => this.loadLeads(),
      });
    }
  }

  exportCSV() {
    const headers = ['Name', 'Email', 'Phone', 'Tags', 'Date'];
    const rows = this.filteredLeads.map((l) => [
      `"${l.name}"`,
      `"${l.email}"`,
      `"${l.phone || ''}"`,
      `"${(l.tags || []).join(';')}"`,
      `"${l.createdAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kfunnels_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
