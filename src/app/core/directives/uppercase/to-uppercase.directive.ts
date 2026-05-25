import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    selector: '[appToUppercase]',
    standalone: true
})
export class ToUppercaseDirective {
    // Variable de entrada para activar o desactivar la directiva
    @Input('appToUppercase') enabled = false;

    constructor(private el: ElementRef) { }

    @HostListener('input', ['$event']) onInput(event: any): void {
        if (this.enabled) {
            const start = this.el.nativeElement.selectionStart;
            const end = this.el.nativeElement.selectionEnd;
            this.el.nativeElement.value = this.el.nativeElement.value.toUpperCase();
            this.el.nativeElement.setSelectionRange(start, end);
        }
    }
}
