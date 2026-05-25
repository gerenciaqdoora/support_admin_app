import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'blankFormat',
    standalone: true
})
export class BlankFormatPipe implements PipeTransform {
    transform(value: any): string {
        const technicalCodes = ['BLANK', '00', '0'];
        if (value === null || value === undefined || value === '' || technicalCodes.includes(String(value).trim().toUpperCase())) {
            return '';
        }
        return value;
    }
}
