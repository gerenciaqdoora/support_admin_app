import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rutFormat',
  standalone: true,
})
export class RutFormatPipe implements PipeTransform {

  transform(value: string | number): string {

    if(value){
        // Convertir el valor a string si es un número
        let rut = value.toString();

        // Asegurarse de que no tenga puntos ni guiones antes de formatearlo
        rut = rut.replace(/\./g, '').replace('-', '');

        if (rut.length < 2) return rut;

        // Separar el dígito verificador
        const dv = rut.slice(-1);
        const cuerpo = rut.slice(0, -1);

        // Formatear con puntos cada tres dígitos
        let formattedRut = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Agregar el dígito verificador con un guión
        return `${formattedRut}-${dv}`;
    }

    return '';

  }
}
