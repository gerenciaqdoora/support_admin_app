export class JsonResponse<T> {
    constructor(
      public data: T,        // El tipo de data es genérico para poder manejar cualquier tipo de datos
      public status: number, // Código de estado HTTP
      public message: string, // Mensaje de respuesta
      public errors: any    // Errores que pueden ocurrir, puede ser un array o un objeto
    ) {}
  }
