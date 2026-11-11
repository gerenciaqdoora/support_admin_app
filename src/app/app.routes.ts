import { Routes } from '@angular/router';
import { ShellComponent } from '@app/layout/shell/shell.component';
import { authGuard } from '@core/guards/auth.guard';
import { consigneeImportResolver } from '@modules/admin/consignee-import/consignee-import.resolver';
import { CONSIGNEE_KIND } from '@modules/admin/consignee-import/consignee-import.kind';
import { SUPPLIER_KIND } from '@modules/admin/supplier-import/supplier-import.kind';
import { EMPLOYEE_KIND } from '@modules/admin/employee-import/employee-import.kind';
import { ISSUER_KIND } from '@modules/admin/issuer-import/issuer-import.kind';
import { importWizardResolver } from '@modules/admin/import-wizard/import-wizard.resolver';

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
        path: 'subscriptions/expirations',
        loadComponent: () =>
          import('@modules/subscribers/subscription-expirations/subscription-expirations.component').then(
            (m) => m.SubscriptionExpirationsComponent,
          ),
        data: { breadcrumb: 'Vencimientos' },
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
        path: 'admin/sii-certification/:companyId',
        loadComponent: () =>
          import('@modules/admin/sii-certification/sii-certification.component').then(
            (m) => m.SiiCertificationComponent,
          ),
        data: { breadcrumb: 'Certificación SII' },
      },
      {
        path: 'admin/imports/:companyId',
        loadComponent: () =>
          import('@modules/admin/import-wizard/import-wizard.component').then((m) => m.ImportWizardComponent),
        resolve: { wizardData: importWizardResolver },
        data: { breadcrumb: 'Importaciones' },
      },
      {
        path: 'admin/consignee-import/:companyId',
        loadComponent: () =>
          import('@modules/admin/consignee-import/consignee-import.component').then((m) => m.ConsigneeImportComponent),
        resolve: { importData: consigneeImportResolver },
        data: { breadcrumb: 'Importar consignatarios', kind: CONSIGNEE_KIND },
      },
      {
        path: 'admin/supplier-import/:companyId',
        loadComponent: () =>
          import('@modules/admin/consignee-import/consignee-import.component').then((m) => m.ConsigneeImportComponent),
        resolve: { importData: consigneeImportResolver },
        data: { breadcrumb: 'Importar proveedores', kind: SUPPLIER_KIND },
      },
      {
        path: 'admin/employee-import/:companyId',
        loadComponent: () =>
          import('@modules/admin/consignee-import/consignee-import.component').then((m) => m.ConsigneeImportComponent),
        resolve: { importData: consigneeImportResolver },
        data: { breadcrumb: 'Importar empleados', kind: EMPLOYEE_KIND },
      },
      {
        path: 'admin/issuer-import/:companyId',
        loadComponent: () =>
          import('@modules/admin/consignee-import/consignee-import.component').then((m) => m.ConsigneeImportComponent),
        resolve: { importData: consigneeImportResolver },
        data: { breadcrumb: 'Importar emisores', kind: ISSUER_KIND },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
