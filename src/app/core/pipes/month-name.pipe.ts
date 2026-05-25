import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

/**
 * Convierte un número de mes (en formato string '01', '1', '12') a su nombre completo en español.
 * * Uso: {{ '01' | monthName }} -> Enero
 */
@Pipe({
    name: 'monthName',
    standalone: true,
})
export class MonthNamePipe implements PipeTransform {

    transform(monthCode: string | number | null): string {
        if (monthCode === null || monthCode === undefined) {
            return '';
        }

        // Aseguramos que sea un número para Luxon, si viene como string lo parseamos
        const monthNumber = typeof monthCode === 'string' ? parseInt(monthCode, 10) : monthCode;

        // Validar que el número de mes esté en el rango 1-12
        if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
            console.warn(`[MonthNamePipe] Código de mes inválido: ${monthCode}`);
            return 'Mes inválido';
        }

        // Usar Luxon para obtener el nombre del mes
        // Creamos un objeto DateTime solo con el mes, usando la configuración local ('es' de tu app)
        // El 'locale' se toma del proveedor MAT_DATE_LOCALE que ya tienes configurado en 'es'
        const monthName = DateTime.local()
            .setZone('America/Santiago') // Forzar chile
            .setLocale('es') // Forzar el idioma a español
            .set({ month: monthNumber }) // Establecer el mes deseado (1=Enero, 12=Diciembre)
            .toFormat('LLLL'); // 'LLLL' da el nombre completo del mes (ej. "enero")

        // Capitalizamos la primera letra (porque toFormat('LLLL') puede devolverlo en minúsculas)
        return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }
}
