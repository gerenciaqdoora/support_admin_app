import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <!-- Background Decorations -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div class="max-w-md w-full bg-[#1e293b]/80 backdrop-blur-xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 z-10 animate-in fade-in zoom-in duration-700">
        
        <!-- Header Premium -->
        <div class="p-10 pb-8 border-b border-white/5 flex flex-col items-center">
          <div class="mb-8 transform hover:scale-105 transition-transform duration-500">
            <svg width="220" height="60" viewBox="0 0 360 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="38" stroke="#00BCD4" stroke-width="14" fill="none"/>
              <path d="M72 75L90 95" stroke="#00BCD4" stroke-width="14" stroke-linecap="round"/>
              <text x="105" y="75" font-family="'Outfit', 'Inter', sans-serif" font-weight="900" font-size="78" fill="#FFFFFF" letter-spacing="-4">doorA</text>
              <text x="105" y="98" font-family="'Outfit', 'Inter', sans-serif" font-weight="700" font-size="11" fill="#94a3b8" letter-spacing="2.5">RENTABILIZA Y VALORA TU TRABAJO</text>
            </svg>
          </div>
          <div class="space-y-2 text-center">
            <h1 class="text-2xl font-black text-white tracking-tight uppercase">Portal de Soporte</h1>
            <p class="text-slate-400 font-medium text-xs uppercase tracking-[0.2em] opacity-60">Seguridad de Acceso Corporativo</p>
          </div>
        </div>

        <!-- Form -->
        <div class="p-10">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-7">
            
            <!-- Email -->
            <div class="space-y-3 group">
              <label for="email" class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-blue-400">Correo Electrónico</label>
              <div class="relative">
                <input 
                  id="email" 
                  type="email" 
                  formControlName="email"
                  class="w-full bg-[#0f172a]/50 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                  placeholder="agente@qdoora.com"
                >
                <div class="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                   <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
            </div>

            <!-- Password -->
            <div class="space-y-3 group">
              <label for="password" class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-blue-400">Contraseña de Red</label>
              <div class="relative">
                <input 
                  id="password" 
                  type="password" 
                  formControlName="password"
                  class="w-full bg-[#0f172a]/50 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                  placeholder="••••••••"
                >
                <div class="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                   <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
            </div>

            <!-- Remember Me -->
            <div class="flex items-center justify-between px-1">
              <label class="flex items-center gap-3 cursor-pointer group">
                <div class="relative flex items-center">
                  <input 
                    type="checkbox" 
                    formControlName="remember"
                    class="peer appearance-none w-5 h-5 bg-[#0f172a]/50 border border-white/10 rounded-lg checked:bg-blue-600 checked:border-blue-500 transition-all cursor-pointer focus:ring-4 focus:ring-blue-500/10"
                  >
                  <svg class="absolute w-3.5 h-3.5 text-white left-[3px] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <span class="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Recordar Credenciales</span>
              </label>
              
              <a href="#" class="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors cursor-pointer">¿Olvidó su clave?</a>
            </div>

            <!-- Error Message -->
            @if (errorMessage()) {
              <div class="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold flex items-center gap-4 animate-in slide-in-from-top-2">
                <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                   <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-width="2.5" stroke-linecap="round"/></svg>
                </div>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <!-- Submit Button -->
            <button 
              type="submit" 
              [disabled]="loginForm.invalid || isLoading()"
              class="w-full relative group h-[60px] cursor-pointer"
            >
              <div class="absolute inset-0 bg-blue-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity group-disabled:opacity-0"></div>
              <div class="relative w-full h-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 shadow-xl active:scale-[0.98] border border-blue-400/30">
                @if (isLoading()) {
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verificando...</span>
                } @else {
                  <span>Ingresar al Sistema</span>
                  <svg class="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                }
              </div>
            </button>
          </form>
        </div>

        <!-- Footer -->
        <div class="px-10 py-8 bg-[#0f172a]/40 border-t border-white/5 flex justify-center items-center gap-6">
           <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">&copy; 2026 QDOORA SPA</span>
           <div class="h-4 w-px bg-white/5"></div>
           <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">v4.0.0-PRO</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes zoom-in { from { transform: scale(0.95); } to { transform: scale(1); } }
    @keyframes slide-in-from-top-2 { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-in { animation-fill-mode: forwards; }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false]
  });

  ngOnInit() {
    this.checkRemembered();
  }

  checkRemembered() {
    const savedEmail = localStorage.getItem('remembered_email');
    const savedPassword = localStorage.getItem('remembered_password');
    
    if (savedEmail) {
      this.loginForm.patchValue({
        email: savedEmail,
        password: savedPassword ? atob(savedPassword) : '',
        remember: true
      });
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password, remember } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        if (remember) {
          localStorage.setItem('remembered_email', email!);
          localStorage.setItem('remembered_password', btoa(password!));
        } else {
          localStorage.removeItem('remembered_email');
          localStorage.removeItem('remembered_password');
        }
        
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Credenciales inválidas o error de red.');
      }
    });
  }
}
