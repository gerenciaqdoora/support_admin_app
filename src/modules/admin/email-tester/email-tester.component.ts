import { Component, inject, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { EmailSupportService } from '@core/services/email-support.service';
import { SubscriberService } from '@core/services/subscriber.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-email-tester',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './email-tester.component.html',
  styleUrls: ['./email-tester.component.scss'],
})
export class EmailTesterComponent {
  private _fb = inject(FormBuilder);
  private _emailService = inject(EmailSupportService);
  private _subscriberService = inject(SubscriberService);

  // Exponemos los suscriptores del servicio para el selector
  subscribers = this._subscriberService.subscribers;

  // Estado del Dropdown de Plantillas
  isDropdownOpen = signal(false);
  searchTerm = signal('');

  // Estado del Dropdown de Suscriptores
  isSubDropdownOpen = signal(false);
  subSearchTerm = signal('');

  // Señal para el estado de carga y feedback
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Recurso reactivo para obtener los mailables
  mailablesResource = rxResource({
    stream: () => this._emailService.listMailables(),
  });

  // Lista de mailables derivados del recurso
  mailables = computed(() => {
    const res = this.mailablesResource.value();
    return res?.data || [];
  });

  // Filtrado reactivo de mailables
  filteredMailables = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return this.mailables();
    return this.mailables().filter((m: any) => m.name.toLowerCase().includes(search));
  });

  filteredSubscribers = computed(() => {
    const search = this.subSearchTerm().toLowerCase().trim();
    const all = this.subscribers();
    if (!search) return all;
    return all.filter((s: any) => (s.usuario?.name || '').toLowerCase().includes(search));
  });

  // Mailable seleccionado actualmente
  selectedMailable = signal<any>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.isDropdownOpen.set(false);
    this.isSubDropdownOpen.set(false);
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isDropdownOpen.update((v) => !v);
    this.isSubDropdownOpen.set(false);
  }

  toggleSubDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isSubDropdownOpen.update((v: boolean) => !v);
    this.isDropdownOpen.set(false);
  }

  selectMailable(mailable: any, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedMailable.set(mailable);
    this.isDropdownOpen.set(false);
    this.searchTerm.set('');
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  selectSubscriber(subscriber: any, event: MouseEvent): void {
    event.stopPropagation();
    this.isSubDropdownOpen.set(false);
    this.subSearchTerm.set('');

    if (subscriber) {
      const dataGroup = this.dynamicForm.get('data') as FormGroup;
      // Seteamos el ID en el campo suscriptor
      dataGroup.get('suscriptor')?.setValue(subscriber.id);

      // Sincronizamos nombre y email si existen
      if (dataGroup.contains('nombre')) {
        dataGroup.get('nombre')?.setValue(subscriber.usuario?.name);
      }
      if (dataGroup.contains('email')) {
        dataGroup.get('email')?.setValue(subscriber.usuario?.email);
      }
      // También actualizamos el destinatario principal
      this.dynamicForm.get('to')?.setValue(subscriber.usuario?.email);
    }
  }

  // Formulario dinámico
  dynamicForm: FormGroup = this._fb.group({
    to: ['', [Validators.required, Validators.email]],
    data: this._fb.group({}),
  });

  // Convertimos los cambios de valor del campo 'to' en una Signal para el effect
  private toValueSignal = toSignal(this.dynamicForm.get('to')!.valueChanges);

  constructor() {
    // Cada vez que cambia el mailable seleccionado, reconstruimos el grupo 'data'
    effect(() => {
      const mailable = this.selectedMailable();
      if (mailable) {
        this.rebuildDynamicForm(mailable.fields);
        // Si ya hay un destinatario definido, intentamos pre-poblar el campo 'email' si existe
        this.syncEmailFields();
      }
    });

    // Sincronización automática del destinatario con campos internos de email
    effect(() => {
      const toValue = this.toValueSignal();
      if (toValue) {
        this.syncEmailFields(toValue);
      }
    });
  }

  private syncEmailFields(toValue?: string): void {
    const value = toValue || this.dynamicForm.get('to')?.value;
    const dataGroup = this.dynamicForm.get('data') as FormGroup;
    if (!dataGroup || !value) return;

    // Buscamos campos candidatos a ser sincronizados (case-insensitive)
    const emailFields = ['email', 'mail', 'destinatario', 'recipient'];
    const controls = dataGroup.controls;

    Object.keys(controls).forEach((key) => {
      if (emailFields.includes(key.toLowerCase())) {
        controls[key].setValue(value, { emitEvent: false });
      }
    });
  }

  onMailableChange(event: Event): void {
    const mailableName = (event.target as HTMLSelectElement).value;
    const mailable = this.mailables().find((m: any) => m.name === mailableName);
    this.selectedMailable.set(mailable);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private rebuildDynamicForm(fields: string[]): void {
    const dataGroup = this._fb.group({});
    fields.forEach((field) => {
      dataGroup.addControl(field, this._fb.control('', Validators.required));
    });
    this.dynamicForm.setControl('data', dataGroup);
  }

  get dataGroup(): FormGroup {
    return this.dynamicForm.get('data') as FormGroup;
  }

  get dataControls() {
    return (this.dynamicForm.get('data') as FormGroup).controls;
  }

  sendTest(): void {
    if (this.dynamicForm.invalid) {
      this.dynamicForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const payload = {
      mailable: this.selectedMailable().name,
      to: this.dynamicForm.value.to,
      data: this.dynamicForm.value.data,
    };

    this._emailService.sendTestEmail(payload).subscribe({
      next: () => {
        this.successMessage.set('Correo de prueba enviado con éxito 🚀');
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al enviar el correo ❌');
        this.isLoading.set(false);
      },
    });
  }
}
