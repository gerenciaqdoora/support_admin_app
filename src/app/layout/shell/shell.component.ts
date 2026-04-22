import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <!-- Sidebar -->
      <aside class="w-64 bg-[#1e293b] text-white flex-shrink-0 hidden lg:flex flex-col shadow-2xl z-20">
        <!-- Logo QdoorA Oficial -->
        <div class="p-8 flex flex-col items-center border-b border-white/5 bg-[#0f172a]/40">
          <div class="flex items-center gap-3">
            <svg width="180" height="50" viewBox="0 0 360 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Q -->
              <circle cx="50" cy="50" r="38" stroke="#00BCD4" stroke-width="14" fill="none"/>
              <path d="M72 75L90 95" stroke="#00BCD4" stroke-width="14" stroke-linecap="round"/>
              <!-- doorA -->
              <text x="105" y="75" font-family="'Outfit', 'Inter', sans-serif" font-weight="900" font-size="78" fill="#FFFFFF" letter-spacing="-4">doorA</text>
              <!-- Slogan -->
              <text x="105" y="98" font-family="'Outfit', 'Inter', sans-serif" font-weight="700" font-size="11" fill="#94a3b8" letter-spacing="2.5">RENTABILIZA Y VALORA TU TRABAJO</text>
            </svg>
          </div>
        </div>

        <nav class="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          <a routerLink="/dashboard" routerLinkActive="bg-blue-600 shadow-lg shadow-blue-900/40 text-white" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5 group text-slate-400 font-bold text-sm cursor-pointer">
            <span class="text-lg">📊</span>
            Dashboard
          </a>
          <a routerLink="/tickets" routerLinkActive="bg-blue-600 shadow-lg shadow-blue-900/40 text-white" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5 group text-slate-400 font-bold text-sm cursor-pointer">
            <span class="text-lg">🎫</span>
            Tickets
          </a>
          <a routerLink="/subscribers" routerLinkActive="bg-blue-600 shadow-lg shadow-blue-900/40 text-white" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5 group text-slate-400 font-bold text-sm cursor-pointer">
            <span class="text-lg">👥</span>
            Suscriptores
          </a>
          <a routerLink="/reports" routerLinkActive="bg-blue-600 shadow-lg shadow-blue-900/40 text-white" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5 group text-slate-400 font-bold text-sm cursor-pointer">
            <span class="text-lg">📈</span>
            Reportes
          </a>
          <a routerLink="/logs-ti" routerLinkActive="bg-blue-600 shadow-lg shadow-blue-900/40 text-white" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5 group text-slate-400 font-bold text-sm border border-transparent hover:border-white/10 cursor-pointer">
            <span class="text-lg">📋</span>
            Explorador de Logs
          </a>
        </nav>

        <div class="p-4 border-t border-white/5 bg-[#0f172a]/20">
          <div class="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div class="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 overflow-hidden flex items-center justify-center">
              <span class="text-blue-400 font-black text-xs">{{ auth.currentUser()?.name?.substring(0, 2)?.toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-black text-white truncate">{{ auth.currentUser()?.name }}</p>
              <p class="text-[9px] text-blue-400 font-bold uppercase tracking-tighter">{{ auth.currentUser()?.role }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 relative">
        <!-- Header Premium con Glassmorphism -->
        <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-40 sticky top-0">
          <div class="flex items-center gap-6">
            <button class="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            
            <!-- Breadcrumbs Premium -->
            <nav class="flex items-center gap-3">
              <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <a routerLink="/" class="hover:text-blue-600 transition-all">QdoorA</a>
                <span class="text-slate-300">/</span>
              </div>
              @for (bc of breadcrumbs(); track bc.url; let last = $last) {
                <div class="flex items-center gap-3 animate-in fade-in slide-in-from-left-1 duration-300">
                  @if (last) {
                    <span class="text-[11px] font-black text-slate-900 uppercase tracking-tight bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{{ bc.label }}</span>
                  } @else {
                    <a [routerLink]="bc.url" class="text-[11px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-tight transition-all">{{ bc.label }}</a>
                    <span class="text-slate-300 text-[10px]">/</span>
                  }
                </div>
              }
            </nav>
          </div>
          
          <div class="flex items-center gap-6">
            <div class="h-8 w-px bg-slate-200/60"></div>
            <button (click)="auth.logout()" class="group flex items-center gap-2.5 px-5 py-2.5 bg-white hover:bg-red-600 text-slate-700 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 hover:border-red-500 shadow-sm hover:shadow-lg hover:shadow-red-200 active:scale-95 cursor-pointer">
              <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Desconectarse</span>
            </button>
          </div>
        </header>

        <!-- Page Area -->
        <main class="flex-1 overflow-y-auto bg-[#f8fafc] p-8 custom-scrollbar">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
  `]
})
export class ShellComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  breadcrumbs = signal<Breadcrumb[]>([]);

  ngOnInit() {
    this.updateBreadcrumbs();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBreadcrumbs();
    });
  }

  private updateBreadcrumbs() {
    const root = this.activatedRoute.root;
    this.breadcrumbs.set(this.getBreadcrumbs(root));
  }

  private getBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({ label, url });
      }

      return this.getBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
