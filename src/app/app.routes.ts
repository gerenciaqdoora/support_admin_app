import { Routes } from '@angular/router';
import { ShellComponent } from '@app/layout/shell/shell.component';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('../modules/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@modules/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        data: { breadcrumb: 'Tablero' },
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('@modules/tickets/ticket-list/ticket-list.component').then(
            (m) => m.TicketListComponent,
          ),
        data: { breadcrumb: 'Tickets' },
        children: [
          {
            path: 'create',
            loadComponent: () =>
              import('@modules/tickets/ticket-create/ticket-create.component').then(
                (m) => m.TicketCreateComponent,
              ),
            data: { breadcrumb: 'Nuevo Ticket' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('@modules/tickets/ticket-preview/ticket-preview.component').then(
                (m) => m.TicketPreviewComponent,
              ),
            data: { breadcrumb: 'Vista Previa' },
          },
        ],
      },
      {
        path: 'tickets/:id/manage',
        loadComponent: () =>
          import('@modules/tickets/ticket-management/ticket-management.component').then(
            (m) => m.TicketManagementComponent,
          ),
        data: { breadcrumb: 'Gestión Forense' },
      },
      {
        path: 'subscribers',
        loadComponent: () =>
          import('@modules/subscribers/subscriber-list/subscriber-list.component').then(
            (m) => m.SubscriberListComponent,
          ),
        data: { breadcrumb: 'Suscriptores' },
      },
      {
        path: 'subscribers/:id',
        loadComponent: () =>
          import('@modules/subscribers/subscriber-detail/subscriber-detail.component').then(
            (m) => m.SubscriberDetailComponent,
          ),
        data: { breadcrumb: 'Detalle de Suscriptor' },
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('@modules/reports/reports.component').then((m) => m.ReportsComponent),
        data: { breadcrumb: 'Reportes' },
      },
      {
        path: 'help-center',
        loadComponent: () =>
          import('@modules/help-center/help-center.component').then((m) => m.HelpCenterComponent),
        data: { breadcrumb: 'Centro de Ayuda' },
      },
      {
        path: 'logs-ti',
        loadComponent: () =>
          import('@modules/logs-ti/logs-ti.component').then((m) => m.LogsTiComponent),
        data: { breadcrumb: 'Logs TI' },
      },
      {
        path: 'admin/customs-subscriber/create',
        loadComponent: () =>
          import('@modules/admin/customs-subscriber/create-customs-subscriber.component').then(
            (m) => m.CreateCustomsSubscriberComponent,
          ),
        data: { breadcrumb: 'Nuevo Plan Aduana' },
      },
      {
        path: 'admin/email-tester',
        loadComponent: () =>
          import('@modules/admin/email-tester/email-tester.component').then(
            (m) => m.EmailTesterComponent,
          ),
        data: { breadcrumb: 'Pruebas de Email' },
      },
      {
        path: 'admin/puc-manager',
        loadChildren: () =>
          import('@modules/admin/puc-manager/puc-manager.routes'),
        data: { breadcrumb: 'Gestión PUC' },
      },
      {
        path: 'admin/nomina-features',
        loadComponent: () =>
          import('@modules/admin/nomina-features/nomina-features.component').then((m) => m.default),
        data: { breadcrumb: 'Configuraciones Empleador de Nómina' },
      },
      {
        path: 'admin/plan-manager',
        loadComponent: () =>
          import('@modules/admin/plan-manager/plan-manager.component').then((m) => m.PlanManagerComponent),
        data: { breadcrumb: 'Gestión de Planes' },
      },
      {
        path: 'admin/sii-manager/:companyId',
        loadComponent: () =>
          import('@modules/admin/sii-manager/sii-manager.component').then((m) => m.SiiManagerComponent),
        data: { breadcrumb: 'Gestión SII' },
      },
      {
        path: 'admin/sii-enablement-queue',
        loadComponent: () =>
          import('@modules/admin/sii-enablement-queue/sii-enablement-queue.component').then(
            (m) => m.SiiEnablementQueueComponent,
          ),
        data: { breadcrumb: 'Habilitación de Producción SII' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
