import { Component, inject, signal, OnInit } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
  ActivatedRoute,
} from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ClientRegistrationComponent } from '../../../modules/admin/clients/components/client-registration/client-registration.component';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <!-- Premium Enterprise Sidebar (Navy Contrast) -->
      <aside
        class="w-64 bg-[#172B4D] text-white flex-shrink-0 hidden lg:flex flex-col z-20 shadow-[8px_0_24px_rgba(0,0,0,0.1)]"
      >
        <!-- Logo Section -->
        <div class="p-4 flex flex-col items-center border-b border-white/5 bg-[#0d1b32]/40">
          <img
            src="/images/qdoora/QdoorA-color-para-fondo-negro.png"
            class="h-28 w-auto object-contain"
            alt="Logo de QdoorA"
          />
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          @for (section of navigation(); track section.id) {
            @if (section.title) {
              <div
                class="px-4 pt-4 pb-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]"
              >
                {{ section.title }}
              </div>
            }
            @for (item of section.children; track item.id) {
              <a
                [routerLink]="item.link"
                routerLinkActive="bg-blue-600 shadow-lg shadow-blue-900/40 text-white font-bold"
                [routerLinkActiveOptions]="{ exact: item.link === '/dashboard' }"
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5 group text-slate-400 font-bold text-sm cursor-pointer border border-transparent"
              >
                <span class="text-lg transition-transform group-hover:scale-110">{{
                  item.icon
                }}</span>
                <span class="tracking-tight">{{ item.title }}</span>

                <!-- Active Indicator -->
                <div
                  class="ml-auto w-1 h-3 rounded-full bg-cyan-400 opacity-0 group-[.active]:opacity-100 transition-opacity"
                ></div>
              </a>
            }
          }
        </nav>

        <!-- User Profile Bottom -->
        <div class="p-4 border-t border-white/5 bg-[#0d1b32]/20">
          <div
            class="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group cursor-pointer"
          >
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:scale-105 transition-transform"
            >
              <span class="text-white font-black text-xs">{{
                auth.currentUser()?.name?.substring(0, 2)?.toUpperCase()
              }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-black text-white truncate">
                {{ auth.currentUser()?.name }}
              </p>
              <p class="text-[9px] text-cyan-400 font-black uppercase tracking-wider">
                {{ auth.currentUser()?.role }}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 relative">
        <!-- Header con Contraste Refinado -->
        <header
          class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-40 sticky top-0 shadow-sm"
        >
          <div class="flex items-center gap-6">
            <button
              class="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>

            <!-- Breadcrumbs -->
            <nav class="flex items-center gap-2">
              <div
                class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400"
              >
                <a routerLink="/" class="hover:text-blue-600 transition-all">QdoorA</a>
                <span class="text-slate-300">/</span>
              </div>
              @for (bc of breadcrumbs(); track bc.url; let last = $last) {
                <div
                  class="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-300"
                >
                  @if (last) {
                    <span
                      class="text-[11px] font-bold text-slate-900 tracking-tight bg-slate-50 px-3 py-1 rounded-md border border-slate-200"
                      >{{ bc.label }}</span
                    >
                  } @else {
                    <a
                      [routerLink]="bc.url"
                      class="text-[11px] font-medium text-slate-500 hover:text-blue-600 tracking-tight transition-all"
                      >{{ bc.label }}</a
                    >
                    <span class="text-slate-300">/</span>
                  }
                </div>
              }
            </nav>
          </div>

          <div class="flex items-center gap-6">
            @if (auth.isAdminRole()) {
              <button
                (click)="openClientRegistration()"
                class="group flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-900/20 active:scale-95 cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Nuevo Cliente</span>
              </button>
            }
            <div class="h-8 w-px bg-slate-200"></div>
            <button
              (click)="auth.logout()"
              class="group flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Salir del Sistema</span>
            </button>
          </div>
        </header>

        <!-- Page Area -->
        <main class="flex-1 min-h-0 relative bg-[#f4f7fa]">
          <!-- Pattern Background sutil -->
          <div
            class="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
            style="background-image: radial-gradient(#172B4D 1px, transparent 1px); background-size: 40px 40px;"
          ></div>

          <div class="relative z-10 h-full overflow-y-auto custom-scrollbar">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      .active {
        background-color: #2563eb !important;
        color: white !important;
        box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
      }
    `,
  ],
})
export class ShellComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  openClientRegistration() {
    this.dialog.open(ClientRegistrationComponent, {
      panelClass: 'dialog-panel',
      disableClose: true,
      width: '1000px',
      maxWidth: '95vw'
    });
  }

  breadcrumbs = signal<Breadcrumb[]>([]);
  navigation = signal<any[]>([]);

  ngOnInit() {
    this.updateBreadcrumbs();
    this.loadNavigation();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.updateBreadcrumbs();
    });
  }

  loadNavigation() {
    if (this.auth.isAdminRole()) {
      // Navegación completa forzada para Administradores
      const fullNav = [
        {
          id: 'support',
          title: 'Gestión Operativa',
          children: [
            { id: 'dashboard', title: 'Tablero', link: '/dashboard', icon: '📊' },
            { id: 'tickets', title: 'Tickets', link: '/tickets', icon: '🎟️' },
            { id: 'subscribers', title: 'Suscriptores', link: '/subscribers', icon: '👥' },
          ],
        },
        {
          id: 'admin',
          title: 'Control y Auditoría TI',
          children: [
            { id: 'logs-ti', title: 'Logs TI', link: '/logs-ti', icon: '📜' },
            { id: 'reports', title: 'Reportes', link: '/reports', icon: '📊' },
            { id: 'help-center', title: 'Centro de Ayuda', link: '/help-center', icon: '📚' },
            {
              id: 'customs-create',
              title: 'Nuevo Cliente | Plan Aduana',
              link: '/admin/customs-subscriber/create',
              icon: '🚢',
            },
            {
              id: 'email-tester',
              title: 'Depurador de Emails',
              link: '/admin/email-tester',
              icon: '📧',
            },
            {
              id: 'nomina-features',
              title: 'Configuraciones Empleador de Nómina',
              link: '/admin/nomina-features',
              icon: '⚙️',
            },
            {
              id: 'puc-manager',
              title: 'Gestor Plan Único de Cuentas',
              link: '/admin/puc-manager',
              icon: '💼',
            },
          ],
        },
      ];
      this.navigation.set(fullNav);
      return;
    }

    this.auth.getNavigation().subscribe({
      next: (nav) => {
        // Traducir 'Dashboard' a 'Tablero' en la navegación de forma robusta
        const translatedNav = nav.map((section) => ({
          ...section,
          children:
            section.children?.map((item: any) => ({
              ...item,
              title: item.title?.trim().toLowerCase() === 'dashboard' ? 'Tablero' : item.title,
            })) || [],
        }));
        this.navigation.set(translatedNav);
      },
      error: () => {},
    });
  }

  private updateBreadcrumbs() {
    const root = this.activatedRoute.root;
    this.breadcrumbs.set(this.getBreadcrumbs(root));
  }

  private getBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Breadcrumb[] = [],
  ): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        const alreadyExists = breadcrumbs.some(b => b.url === url);
        if (!alreadyExists) {
          breadcrumbs.push({ label, url });
        }
      }

      return this.getBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
