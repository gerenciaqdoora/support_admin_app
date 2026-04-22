import { Routes } from '@angular/router';
import { ShellComponent } from '@app/layout/shell/shell.component';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../modules/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('@modules/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { breadcrumb: 'Dashboard' }
      },
      {
        path: 'tickets',
        loadComponent: () => import('@modules/tickets/ticket-list/ticket-list.component').then(m => m.TicketListComponent),
        data: { breadcrumb: 'Tickets' }
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('@modules/tickets/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent),
        data: { breadcrumb: 'Detalle de Ticket' }
      },
      {
        path: 'subscribers',
        loadComponent: () => import('@modules/subscribers/subscriber-list/subscriber-list.component').then(m => m.SubscriberListComponent),
        data: { breadcrumb: 'Suscriptores' }
      },
      {
        path: 'subscribers/:id',
        loadComponent: () => import('@modules/subscribers/subscriber-detail/subscriber-detail.component').then(m => m.SubscriberDetailComponent),
        data: { breadcrumb: 'Detalle de Suscriptor' }
      },
      {
        path: 'reports',
        loadComponent: () => import('@modules/reports/reports.component').then(m => m.ReportsComponent),
        data: { breadcrumb: 'Reportes' }
      },
      {
        path: 'help-center',
        loadComponent: () => import('@modules/help-center/help-center.component').then(m => m.HelpCenterComponent),
        data: { breadcrumb: 'Centro de Ayuda' }
      },
      {
        path: 'logs-ti',
        loadComponent: () => import('@modules/logs-ti/logs-ti.component').then(m => m.LogsTiComponent),
        data: { breadcrumb: 'Logs TI' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
