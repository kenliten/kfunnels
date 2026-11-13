import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout-wrapper">
      <!-- Top Navigation Bar -->
      <header class="topbar">
        <div class="topbar-left">
          <a routerLink="/" class="brand-logo">
            <div class="logo-icon">
              <i class="pi pi-bolt"></i>
            </div>
            <div class="logo-text">
              <span class="logo-name">K-FUNNELS</span>
              <span class="logo-badge">AI 3.8</span>
            </div>
          </a>
        </div>

        <nav class="topbar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <i class="pi pi-chart-bar"></i>
            <span>Dashboard</span>
          </a>
          <a routerLink="/funnels" routerLinkActive="active" class="nav-item">
            <i class="pi pi-filter"></i>
            <span>Funnels</span>
          </a>
          <a routerLink="/ai-wizard" routerLinkActive="active" class="nav-item ai-pill">
            <i class="pi pi-sparkles"></i>
            <span>AI Architect</span>
          </a>
          <a routerLink="/ai-copywriter" routerLinkActive="active" class="nav-item">
            <i class="pi pi-pencil"></i>
            <span>AI Copywriter</span>
          </a>
          <a routerLink="/cro-auditor" routerLinkActive="active" class="nav-item">
            <i class="pi pi-search-plus"></i>
            <span>CRO Auditor</span>
          </a>
          <a routerLink="/contacts" routerLinkActive="active" class="nav-item">
            <i class="pi pi-users"></i>
            <span>Contacts</span>
          </a>
          <a routerLink="/orders" routerLinkActive="active" class="nav-item">
            <i class="pi pi-dollar"></i>
            <span>Orders</span>
          </a>
        </nav>

        <div class="topbar-right">
          <a routerLink="/ai-wizard" class="btn-create-funnel">
            <i class="pi pi-plus"></i>
            <span>New Funnel</span>
          </a>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .topbar {
      height: 68px;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .topbar-left {
      display: flex;
      align-items: center;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 1.25rem;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .logo-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo-name {
      font-weight: 800;
      font-size: 1.2rem;
      letter-spacing: -0.02em;
      color: #ffffff;
    }

    .logo-badge {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .topbar-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.2s ease;

      i {
        font-size: 0.95rem;
      }

      &:hover {
        color: #f8fafc;
        background: rgba(255, 255, 255, 0.05);
      }

      &.active {
        color: #ffffff;
        background: #1e293b;
        font-weight: 600;
      }
    }

    .ai-pill {
      background: rgba(99, 102, 241, 0.12);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);

      &:hover {
        background: rgba(99, 102, 241, 0.2);
        color: #c7d2fe;
      }

      &.active {
        background: #4f46e5;
        color: #ffffff;
      }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-create-funnel {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      padding: 0.5rem 1.1rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
      }
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }

    @media (max-width: 1024px) {
      .topbar {
        padding: 0 1rem;
      }
      .nav-item span {
        display: none;
      }
      .main-content {
        padding: 1rem;
      }
    }
  `],
})
export class AppLayoutComponent {}
