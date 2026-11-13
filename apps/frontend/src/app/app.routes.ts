import { Route } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';

export const appRoutes: Route[] = [
  // Public visitor funnel pages (clean landing page layout)
  {
    path: 'f/:slug',
    loadComponent: () =>
      import('./pages/public-viewer/public-viewer.component').then(
        (m) => m.PublicViewerComponent
      ),
  },
  {
    path: 'f/:slug/:stepSlug',
    loadComponent: () =>
      import('./pages/public-viewer/public-viewer.component').then(
        (m) => m.PublicViewerComponent
      ),
  },

  // Authenticated App Workspace Layout
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'funnels',
        loadComponent: () =>
          import('./pages/funnels-list/funnels-list.component').then(
            (m) => m.FunnelsListComponent
          ),
      },
      {
        path: 'funnels/:id/builder',
        loadComponent: () =>
          import('./pages/funnel-builder/funnel-builder.component').then(
            (m) => m.FunnelBuilderComponent
          ),
      },
      {
        path: 'ai-wizard',
        loadComponent: () =>
          import('./pages/ai-wizard/ai-funnel-wizard.component').then(
            (m) => m.AiFunnelWizardComponent
          ),
      },
      {
        path: 'ai-copywriter',
        loadComponent: () =>
          import('./pages/ai-copywriter/ai-copywriter.component').then(
            (m) => m.AiCopywriterComponent
          ),
      },
      {
        path: 'cro-auditor',
        loadComponent: () =>
          import('./pages/cro-auditor/cro-auditor.component').then(
            (m) => m.CroAuditorComponent
          ),
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('./pages/contacts/contacts.component').then(
            (m) => m.ContactsComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders/orders.component').then(
            (m) => m.OrdersComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
