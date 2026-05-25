import { Pipe, PipeTransform } from '@angular/core';
import { Currency } from '../models/currency.model';

@Pipe({ name: 'formatAmount', standalone: true })
export class FormatAmountPipe implements PipeTransform {
    transform(value: string | number, currency: Currency = new Currency({ code: 'CLP' }), decimals: number | null = null): string {
        if (value == null || value === '') return '';

        let numeric = String(value).replace(/[^0-9.]/g, '');

        // Decidiremos los separadores basándonos en la moneda o si se especifican decimales (típico de indicadores chilenos)
        const isCLFormat = currency.code === 'CLP' || decimals !== null;
        const thousandsSeparator = isCLFormat ? '.' : ',';
        const decimalSeparator = isCLFormat ? ',' : '.';

        // Si no se especifican decimales y es CLP, mantenemos el comportamiento original (sin decimales)
        const decimalCount = decimals !== null ? decimals : (currency.code === 'CLP' ? 0 : 2);

        const parts = numeric.split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

        if (decimalCount === 0) {
            return integerPart;
        }

        const decimalPart = (parts[1] || '').padEnd(decimalCount, '0').slice(0, decimalCount);
        return `${integerPart}${decimalSeparator}${decimalPart}`;
    }
}
