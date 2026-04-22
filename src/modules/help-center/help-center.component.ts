import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HelpCenterService } from '@core/services/help-center.service';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-12 pb-20 max-w-6xl mx-auto">
      
      <!-- Hero Header & Search -->
      <div class="text-center space-y-6 bg-primary rounded-[3rem] p-16 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div class="absolute inset-0 bg-white/5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
        <h1 class="text-4xl font-black relative z-10">¿Cómo podemos ayudarte?</h1>
        <p class="text-primary-100 font-medium max-w-xl mx-auto relative z-10">Encuentra guías, manuales y respuestas rápidas a las preguntas más frecuentes sobre la plataforma.</p>
        
        <div class="relative max-w-2xl mx-auto z-10 mt-8">
          <input type="text" #s (input)="helpService.searchQuery.set(s.value)" placeholder="Busca artículos, errores o tutoriales..." 
                 class="w-full pl-14 pr-6 py-5 rounded-2xl border-none text-slate-800 bg-white/95 focus:bg-white focus:ring-4 ring-white/30 outline-none text-lg shadow-2xl transition-all placeholder:text-slate-400">
          <span class="absolute left-5 top-5 text-2xl opacity-40 text-slate-800">🔍</span>
          
          @if (helpService.isSearching()) {
            <span class="absolute right-5 top-6 w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
          }
        </div>
      </div>

      <!-- Search Results Dropdown -->
      @if (helpService.searchQuery().length > 0) {
        <div class="space-y-6">
          <h2 class="text-xl font-bold text-slate-800 px-2">Resultados para "{{ helpService.searchQuery() }}"</h2>
          <div class="grid grid-cols-1 gap-4">
            @for (article of helpService.searchResults(); track article.id) {
              <div [routerLink]="['/help-center/articles', article.slug]" class="glass-card bg-white p-6 rounded-2xl hover-scale cursor-pointer group">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg mt-1">📄</div>
                  <div>
                    <h3 class="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">{{ article.title }}</h3>
                    <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ article.content }}</p>
                    <div class="mt-3 flex items-center gap-2">
                      <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 text-slate-500">{{ article.category?.name }}</span>
                      <span class="text-xs text-slate-400">• {{ article.view_count }} vistas</span>
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
               <div class="p-12 text-center text-slate-400 glass-card bg-white rounded-3xl">
                 No se encontraron resultados. Intenta con otros términos.
               </div>
            }
          </div>
        </div>
      } @else {
        <!-- Categories Grid -->
        <div class="space-y-6">
          <div class="flex items-center justify-between px-2">
            <h2 class="text-2xl font-black text-slate-800">Navegar por Categorías</h2>
            <button class="text-sm font-bold text-primary hover:text-primary-600">Crear Categoría +</button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (category of helpService.categories(); track category.id) {
              <div [routerLink]="['/help-center/categories', category.slug]" class="glass-card bg-white p-8 rounded-3xl hover-scale cursor-pointer border border-transparent hover:border-accent/10 group flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-slate-50 text-3xl flex items-center justify-center mb-6 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  {{ category.icon || '📚' }}
                </div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">{{ category.name }}</h3>
                <p class="text-sm text-slate-400 mb-6">{{ category.description || 'Explora los manuales y guías de esta sección.' }}</p>
                <div class="mt-auto pt-4 w-full border-t border-slate-50 text-sm font-black text-slate-300 group-hover:text-primary transition-colors">
                  {{ category.articles_count }} Artículos →
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class HelpCenterComponent {
  helpService = inject(HelpCenterService);
}
