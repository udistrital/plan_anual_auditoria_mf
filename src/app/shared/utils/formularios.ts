import { FormularioDinamicoComponent } from "../elements/components/formulario-dinamico/formulario-dinamico.component";

/**
 * Establece la lógica de campos secuenciales en un formulario dinámico
 * @param formComponent - Instancia del FormularioDinamicoComponent
 * @param sequentialFields - Array con los nombres de los campos en orden secuencial
 *
 * Ejemplo de uso:
 * establecerCamposSecuenciales(
 *   this.formularioInformacionComponent,
 *   ['tipo', 'proceso', 'lider', 'responsable']
 * );
 */
export function establecerCamposSecuenciales(
  formComponent: FormularioDinamicoComponent,
  sequentialFields: string[]
) {
  // Suscribirse al evento campoSeleccionado
  formComponent.campoSeleccionado.subscribe(
    (event: { campo: any; valor: any }) => {
      // Encontrar el índice del campo actual en la secuencia
      const currentIndex = sequentialFields.indexOf(event.campo.nombre);

      // Si el campo está en la secuencia y no es el último
      if (currentIndex !== -1 && currentIndex < sequentialFields.length - 1) {
        // Limpiar todos los campos que le siguen
        for (let i = currentIndex + 1; i < sequentialFields.length; i++) {
          const nextFieldName = sequentialFields[i];

          // Limpiar el valor en el form
          formComponent.form.get(nextFieldName)?.reset();

          // Limpiar las opciones del campo en el formulario
          const nextField = formComponent.formulario.campos?.find(
            (campo) => campo.nombre === nextFieldName
          );
          if (nextField?.parametros) {
            nextField.parametros.opciones = [];
          }
        }
      }
    }
  );
}
