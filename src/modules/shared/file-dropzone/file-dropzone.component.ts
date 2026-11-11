import { ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';

/**
 * Zona de carga de archivos reutilizable: toda el área abre el selector,
 * acepta arrastrar y soltar, y muestra el archivo elegido.
 * No procesa el archivo: lo emite y el padre decide qué hacer con él.
 */
@Component({
  selector: 'app-file-dropzone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="button"
      tabindex="0"
      [attr.aria-label]="title()"
      class="group relative flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-10 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      [class]="dragging() ? 'border-blue-500 bg-blue-50' : errors().length ? 'border-red-300 bg-white hover:border-red-400' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'"
      (click)="input().nativeElement.click()"
      (keydown.enter)="input().nativeElement.click()"
      (keydown.space)="$event.preventDefault(); input().nativeElement.click()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform duration-200 group-hover:-translate-y-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      </span>

      <div class="space-y-1">
        <p class="font-black uppercase text-sm tracking-wide text-slate-800">{{ title() }}</p>
        <p class="text-xs text-slate-500">
          @if (dragging()) { Suelte el archivo aquí } @else { o <span class="font-bold text-blue-600 underline underline-offset-2">haga clic para seleccionarlo</span> }
        </p>
        @if (hint()) { <p class="text-[11px] text-slate-400">{{ hint() }}</p> }
      </div>

      @if (fileName(); as name) {
        <span class="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clip-rule="evenodd" />
          </svg>
          <span class="truncate">{{ name }}</span>
        </span>
      }

      @if (templateText()) {
        <button
          type="button"
          class="cursor-pointer text-xs font-bold text-blue-600 underline underline-offset-2 hover:text-blue-800"
          (click)="$event.stopPropagation(); template.emit()"
        >
          {{ templateText() }}
        </button>
      }

      <input #fileInput type="file" class="hidden" [accept]="accept()" (change)="onPick($event)" (click)="$event.stopPropagation()" />
    </div>

    @if (errors().length) {
      <div role="alert" class="mt-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V7a1 1 0 0 0-1-1Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
          </svg>
        </span>
        <div class="min-w-0 space-y-1">
          <p class="text-sm font-black uppercase tracking-wide text-red-800">El archivo no se puede importar</p>
          <ul class="space-y-1 text-xs text-red-700">
            @for (e of errors(); track e) {
              <li class="flex gap-2"><span aria-hidden="true">•</span><span>{{ e }}</span></li>
            }
          </ul>
        </div>
      </div>
    }
  `,
})
export class FileDropzoneComponent {
  readonly title = input.required<string>();
  readonly hint = input<string>('');
  readonly accept = input<string>('');
  readonly templateText = input<string>('');
  readonly fileName = input<string | null>(null);
  /** Errores de validación del archivo; se muestran bajo la zona. */
  readonly errors = input<string[]>([]);

  readonly fileSelected = output<File>();
  readonly template = output<void>();

  protected readonly dragging = signal(false);
  protected readonly input = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.fileSelected.emit(file);
  }

  protected onPick(event: Event): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    if (file) this.fileSelected.emit(file);
    el.value = ''; // permite volver a elegir el mismo archivo
  }
}
