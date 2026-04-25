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
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      <!-- Premium Ambient Decorations -->
      <div class="absolute left-[-10%] bottom-[-10%] w-[40%] h-[50%] pointer-events-none hidden lg:block animate-float">
        <div class="relative w-full h-full flex items-center justify-center">
          <svg class="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#0052CC" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C86.9,14.6,81.2,29.1,72.4,41.4C63.6,53.7,51.7,63.7,38.3,71.1C24.8,78.5,9.8,83.3,-4.8,81.6C-19.4,79.9,-33.5,71.7,-46.3,62.8C-59.1,53.8,-70.6,44.1,-77.8,31.7C-85,19.3,-87.8,4.2,-85.4,-10.1C-83,-24.4,-75.4,-37.9,-65.4,-48.9C-55.4,-59.9,-43,-68.5,-30.1,-76.3C-17.2,-84.1,-3.8,-91.1,10.6,-87.4C25,-83.7,30.6,-83.5,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
          <img src="/images/qdoora/logo.png" class="w-1/4 object-contain opacity-20 blur-[1px] transform -rotate-12" alt="Decor">
        </div>
      </div>

      <div class="absolute right-[-10%] top-[-10%] w-[40%] h-[50%] pointer-events-none hidden lg:block animate-float-delayed">
        <div class="relative w-full h-full flex items-center justify-center">
          <svg class="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4C9AFF" d="M39.9,-65.7C54.1,-60.5,69.5,-53.9,77.4,-42.1C85.3,-30.3,85.6,-13.2,82.8,2.7C80,18.7,74.1,33.5,64.2,45.4C54.4,57.3,40.6,66.4,25.8,71.1C11,75.8,-4.8,76.1,-20,72.4C-35.3,68.7,-50,61,-60.8,49.5C-71.6,38,-78.6,22.7,-80.7,6.8C-82.8,-9.1,-80,-25.6,-71.8,-39.3C-63.5,-53.1,-49.8,-64.1,-35.3,-69C-20.7,-73.9,-5.3,-72.7,6.5,-63.9C18.3,-55.1,25.8,-70.9,39.9,-65.7Z" transform="translate(100 100)" />
          </svg>
          <img src="/images/qdoora/logo.png" class="w-1/4 object-contain opacity-20 blur-[1px] transform rotate-12" alt="Decor">
        </div>
      </div>

      <!-- Subtle Grid Background -->
      <div class="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(#0052CC 1px, transparent 1px); background-size: 40px 40px;"></div>

      <div class="max-w-[400px] w-full bg-white/90 backdrop-blur-md rounded-sm shadow-[0_20px_48px_-12px_rgba(9,30,66,0.2)] border border-[#DFE1E6] p-10 z-10 animate-in fade-in zoom-in duration-500">
        
        <!-- Header -->
        <div class="flex flex-col items-center mb-8">
          <div class="mb-6">
            <img src="/images/qdoora/QdoorA-negro-para-fondo-blanco.png" class="h-22 w-auto object-contain" alt="QdoorA Logo">
          </div>
          <h1 class="text-[#172B4D] text-lg font-bold text-center">Iniciar sesión para continuar</h1>
        </div>

        <!-- Role Selector -->
        <div class="mb-8 p-1 bg-[#F4F5F7] rounded-sm flex border border-[#DFE1E6]/50">
          <button 
            type="button"
            (click)="setLoginType('support')"
            [class.bg-white]="loginType() === 'support'"
            [class.shadow-sm]="loginType() === 'support'"
            [class.text-[#0052CC]]="loginType() === 'support'"
            [class.text-[#6B778C]]="loginType() !== 'support'"
            class="flex-1 py-2 text-sm font-semibold transition-all duration-200 rounded-sm cursor-pointer"
          >
            Agente Soporte
          </button>
          <button 
            type="button"
            (click)="setLoginType('admin')"
            [class.bg-white]="loginType() === 'admin'"
            [class.shadow-sm]="loginType() === 'admin'"
            [class.text-[#0052CC]]="loginType() === 'admin'"
            [class.text-[#6B778C]]="loginType() !== 'admin'"
            class="flex-1 py-2 text-sm font-semibold transition-all duration-200 rounded-sm cursor-pointer"
          >
            Administrador TI
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          
          <!-- Email -->
          <div class="space-y-1">
            <input 
              id="email" 
              type="email" 
              formControlName="email"
              class="w-full bg-[#F4F5F7] border-2 border-transparent rounded-sm px-3 py-2 text-sm text-[#172B4D] placeholder-[#6B778C] focus:outline-none focus:bg-white focus:border-[#4C9AFF] transition-all"
              placeholder="Correo electrónico"
            >
          </div>

          <!-- Password -->
          <div class="space-y-1">
            <input 
              id="password" 
              type="password" 
              formControlName="password"
              class="w-full bg-[#F4F5F7] border-2 border-transparent rounded-sm px-3 py-2 text-sm text-[#172B4D] placeholder-[#6B778C] focus:outline-none focus:bg-white focus:border-[#4C9AFF] transition-all"
              placeholder="Contraseña"
            >
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="p-3 rounded-sm bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
               <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
               <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Submit Button -->
          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full bg-[#0052CC] hover:bg-[#0065FF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-2 rounded-sm transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            @if (isLoading()) {
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Verificando...</span>
            } @else {
              <span>Ingresar</span>
            }
          </button>

          <!-- Links -->
          <div class="pt-4 flex flex-col items-center gap-3 border-t border-[#DFE1E6]">
            <a href="#" class="text-sm text-[#0052CC] hover:underline font-medium">¿No puedes iniciar sesión?</a>
            <div class="flex items-center gap-2">
              <span class="w-1 h-1 bg-[#6B778C] rounded-full"></span>
              <a href="#" class="text-sm text-[#0052CC] hover:underline font-medium">Crear una cuenta</a>
            </div>
          </div>
        </form>

        <!-- Footer -->
        <div class="mt-12 text-center space-y-2 border-t border-[#DFE1E6] pt-6">
          <p class="text-[10px] text-[#6B778C] font-bold uppercase tracking-widest">Qdoora Support Portal</p>
          <p class="text-[10px] text-[#6B778C]">Acceso seguro a servicios corporativos unificados</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes zoom-in { from { transform: scale(0.95); } to { transform: scale(1); } }
    @keyframes slide-in-from-top-2 { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes float { 
      0%, 100% { transform: translateY(0) rotate(0deg); } 
      50% { transform: translateY(-20px) rotate(2deg); } 
    }
    @keyframes float-delayed { 
      0%, 100% { transform: translateY(0) rotate(0deg); } 
      50% { transform: translateY(20px) rotate(-2deg); } 
    }
    .animate-in { animation-fill-mode: forwards; }
    .animate-float { animation: float 10s ease-in-out infinite; }
    .animate-float-delayed { animation: float-delayed 12s ease-in-out infinite; }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  loginType = signal<'support' | 'admin'>('support');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false]
  });

  ngOnInit() {
    this.checkRemembered();
  }

  setLoginType(type: 'support' | 'admin') {
    this.loginType.set(type);
    this.errorMessage.set(null);
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

    this.authService.login({ email: email!, password: password! }, this.loginType()).subscribe({
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
