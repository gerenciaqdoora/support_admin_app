import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminCustomsService } from '../../../app/core/services/admin-customs.service';
import { AduanaSubscriberData } from '../../../app/core/models/aduana-subscriber.model';
import { RutFormatPipe } from '../../../app/core/pipes/rut-format.pipe';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-create-customs-subscriber',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RutFormatPipe],
  templateUrl: './create-customs-subscriber.component.html',
})
export class CreateCustomsSubscriberComponent {
  private _fb = inject(FormBuilder);
  private _adminService = inject(AdminCustomsService);
  private _router = inject(Router);

  @ViewChild('alertContainer') alertContainer!: ElementRef;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form: FormGroup = this._fb.group({
    // User Data
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    dni: ['', Validators.required],

    // Company Data
    social_reason: ['', Validators.required],
    rut: ['', Validators.required],
    agent_name: ['', Validators.required],
    agent_code: ['', Validators.required],
    address: [''],
    phone: [''],
  });

  formatRut(event: any, field: string) {
    let value = event.target.value.replace(/\./g, '').replace('-', '');
    if (value.length > 1) {
      const dv = value.slice(-1);
      const cuerpo = value.slice(0, -1);
      const formatted = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
      this.form.get(field)?.setValue(formatted, { emitEvent: false });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const data: AduanaSubscriberData = {
      ...this.form.value,
      name: this.form.value.email, // Usamos el email como nombre de usuario por defecto
      dni: this.form.value.dni.replace(/\./g, '').replace('-', ''),
      rut: this.form.value.rut.replace(/\./g, '').replace('-', ''),
    };

    this._adminService.createAduanaSubscriber(data).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.successMessage.set(response.message);
        this.form.reset();
        this.scrollToAlert();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Ocurrió un error al crear el suscriptor.');
        this.scrollToAlert();
      }
    });
  }

  private scrollToAlert() {
    setTimeout(() => {
      this.alertContainer.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}
