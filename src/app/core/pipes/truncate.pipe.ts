import { Pipe, PipeTransform } from '@angular/core';

/**
 * * Uso: {{ '' | truncate:40 }} Muestra solo 40 caracteres
 */
@Pipe({
    name: 'truncate',
    standalone: true
})
export class TruncatePipe implements PipeTransform {

    transform(value: string | null | undefined, limit: number = 30, ellipsis: string = '...'): string {
        if (!value) return '';

        if (value.length <= limit) {
            return value;
        }

        return value.substring(0, limit).trimEnd() + ellipsis;
    }
}
