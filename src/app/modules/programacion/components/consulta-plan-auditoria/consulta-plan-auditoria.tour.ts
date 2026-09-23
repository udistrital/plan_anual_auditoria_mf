import { type DriveStep } from "driver.js";

export interface PasosTourCallbacks {
  abrirMenuAcciones: () => void;
  editarMarcoGeneral: () => void;
  registrarAuditorias: () => void;
  agregarAuditoria: () => void;
  cancelarAuditoria: () => void;
  abrirCargueMasivo: () => void;
  cancelarCargueMasivo: () => void;
  volverALista: (direccion: "previous" | "next") => void;
}

const SELECTORES = {
  acciones: 'div[role="menu"]',
  botonAcciones: '[data-tour="nuevo-paa"] tbody tr:nth-child(1) td:last-child button',
  botonEditarMarco: 'div[role="menu"] button:nth-child(1)',
  botonRegistrarAuditorias: 'div[role="menu"] button:nth-child(2)',
  botonAgregarAuditoria: '[data-tour="add-auditoria"]',
  botonCancelarAuditoria: '[data-tour="cancelar-auditoria"]',
  botonCargueMasivo: '[data-tour="cargue-masivo"]',
  botonCancelarCargue: '[data-tour="boton-cancelar-archivo"]',
};

const paso = (
  element: string,
  title: string,
  description: string,
  options: Partial<DriveStep["popover"]> = {}
): DriveStep => ({
  element,
  popover: { title, description, ...options },
});

const ejecutarYAvanzar = (
  selector: string,
  accion: () => void,
  avanzar: () => void,
  delay = 0
): (() => void) => () => {
  const elemento = document.querySelector(selector) as HTMLElement | null;
  if (!elemento) return;

  accion();
  setTimeout(avanzar, delay);
};

export function crearPasosTour(callbacks: PasosTourCallbacks, avanzar: () => void): DriveStep[] {
  const avanzarDespuesDe = (selector: string, accion: () => void, delay = 0) =>
    ejecutarYAvanzar(selector, accion, avanzar, delay);

  return [
    paso(
      '[data-tour="crear-paa"]',
      "1. Crear el Plan Anual de Auditoría",
      "Selecciona el año de vigencia y presiona este botón para iniciar el registro del PAA."
    ),
    paso(
      '[data-tour="nuevo-paa"] tbody tr:nth-child(1)',
      "2. Nuevo Plan Anual de Auditoría creado",
      "Este es un plan de demostración que te guiará a través de las acciones disponibles para un PAA en estado Borrador.",
      {
        onNextClick: avanzarDespuesDe(SELECTORES.botonAcciones, callbacks.abrirMenuAcciones),
      }
    ),
    paso(
      SELECTORES.acciones,
      "3. Acciones disponibles para el PAA",
      "Aquí puedes ver las acciones que puedes realizar sobre el Plan Anual de Auditoría en estado Borrador. Por ejemplo, puedes ver el marco general, editarlo, registrar auditorías y enviar el plan a aprobación."
    ),
    paso(
      SELECTORES.botonEditarMarco,
      "4. Editar el marco general del PAA",
      "Esta acción te permite modificar el marco general del PAA, como su Objetivo, Alcance, Criterios y Recursos. Recuerda que solo puedes editar el marco general mientras el PAA esté en estado Borrador.",
      {
        side: "left",
        onNextClick: avanzarDespuesDe(SELECTORES.botonEditarMarco, callbacks.editarMarcoGeneral, 300),
      }
    ),
    paso(
      '[data-tour="formulario-marco-general"]',
      "5. Marco general del PAA",
      "Aquí puedes ver y editar los detalles del marco general del PAA. Una vez que hayas terminado de editar, puedes guardar los cambios y regresar a la lista de planes. Es importante mencionar que la información en los campos del formulario está parametrizada en el sistema cuando se crea un nuevo registro como se muestra en la vista, pero puedes editar información si lo requieres.",
      { onPrevClick: () => callbacks.volverALista("previous") }
    ),
    paso(
      '[data-tour="formulario-marco-general"] form div div:nth-child(1) mat-form-field div:nth-child(1)',
      "6. Objetivo del Marco general del PAA",
      "Este campo permite definir el objetivo del Plan Anual de Auditoría, es decir, la finalidad que se busca alcanzar con la planificación y ejecución de las auditorías durante el año seleccionado."
    ),
    paso(
      '[data-tour="formulario-marco-general"] form div div:nth-child(2) mat-form-field div:nth-child(1)',
      "7. Alcance del Marco general del PAA",
      "Este campo permite definir el alcance del Plan Anual de Auditoría, es decir, los límites y la extensión de las auditorías que se llevarán a cabo durante el año seleccionado."
    ),
    paso(
      '[data-tour="formulario-marco-general"] form div div:nth-child(3) mat-form-field div:nth-child(1)',
      "8. Criterios del Marco general del PAA",
      "Este campo permite definir los criterios que se utilizarán para evaluar y medir el desempeño de las auditorías realizadas durante el año seleccionado."
    ),
    paso(
      '[data-tour="formulario-marco-general"] form div div:nth-child(4) mat-form-field div:nth-child(1)',
      "9. Recursos del Marco general del PAA",
      "Este campo permite definir los recursos necesarios para llevar a cabo las auditorías planificadas en el Plan Anual de Auditoría, incluyendo personal, tiempo, presupuesto y herramientas."
    ),
    paso(
      '[data-tour="guardar-marco-general"]',
      "10. Guardar cambios del Marco general del PAA",
      "Una vez que hayas realizado los cambios necesarios en el marco general del PAA, puedes presionar este botón para guardar la información y regresar a la lista de planes.",
      { side: "left" }
    ),
    paso(
      '[data-tour="regresar-marco-general"]',
      "11. Regresar a la lista de PAA",
      "Para continuar con la segunda parte del registro del Plan Anual de Auditoría, regresa a la lista de planes y selecciona el plan que acabas de crear para registrar las auditorías correspondientes.",
      { side: "left", onNextClick: () => callbacks.volverALista("next") }
    ),
    paso(
      SELECTORES.botonRegistrarAuditorias,
      "12. Registrar auditorías del PAA",
      "Esta acción te permite registrar las auditorías correspondientes al Plan Anual de Auditoría.",
      {
        side: "left",
        onNextClick: avanzarDespuesDe(SELECTORES.botonRegistrarAuditorias, callbacks.registrarAuditorias, 300),
      }
    ),
    paso(
      SELECTORES.botonAgregarAuditoria,
      "13. Añadir Auditoría",
      "Debes de dar click en este botón para añadir una nueva auditoría al Plan Anual de Auditoría. Recuerda que puedes añadir todas las auditorías que sean necesarias para cumplir con el objetivo del plan.",
      {
        side: "left",
        onPrevClick: () => callbacks.volverALista("previous"),
        onNextClick: avanzarDespuesDe(SELECTORES.botonAgregarAuditoria, callbacks.agregarAuditoria, 400),
      }
    ),
    paso(
      '[data-tour="form-add-auditoria"]',
      "14. Formulario de registro de auditoría",
      "Aquí puedes registrar la información de la auditoría que deseas añadir al Plan Anual de Auditoría. Completa todos los campos requeridos y presiona el botón de guardar para añadir la auditoría al plan."
    ),
    paso(
      '[data-tour="form-add-auditoria"] form div div:nth-child(1)',
      "15. Nombre de la auditoría",
      "Este campo permite definir el nombre de la auditoría que se va a registrar en el Plan Anual de Auditoría."
    ),
    paso(
      '[data-tour="form-tipo-evaluacion-auditoria"]',
      "16. Tipo de evaluación",
      "Este campo permite seleccionar el tipo de evaluación que se va a realizar en la auditoría, ya sea una auditoría interna, un seguimiento o un informe de ley."
    ),
    paso(
      '[data-tour="form-macroprocesos-auditoria"]',
      "17. Macroprocesos",
      "Este campo permite seleccionar los macroprocesos que se van a auditar en la auditoría. Puedes seleccionar uno o varios macroprocesos según corresponda."
    ),
    paso(
      '[data-tour="form-add-auditoria"] form div div:nth-child(4)',
      "18. Procesos",
      "Este campo permite seleccionar los procesos que se van a auditar en la auditoría. Puedes seleccionar uno o varios procesos según corresponda. Importante seleccionar primero macroprocesos para que se habiliten los procesos correspondientes."
    ),
    paso(
      '[data-tour="form-add-auditoria"] form div div:nth-child(5)',
      "19. Dependencias",
      "Este campo permite seleccionar las dependencias que se van a auditar en la auditoría. Puedes seleccionar una o varias dependencias según corresponda."
    ),
    paso(
      '[data-tour="form-add-auditoria"] form div div:nth-child(6)',
      "20. Cronograma de actividades",
      "Este campo permite seleccionar los meses en los que se van a realizar las actividades de la auditoría. Puedes seleccionar uno o varios meses según corresponda."
    ),
    paso(
      '[data-tour="form-add-auditoria"] form div div:nth-child(7)',
      "21. Cantidad de Auditorías",
      "Este campo permite seleccionar la cantidad de auditorías que se van a realizar en el Plan Anual de Auditoría."
    ),
    paso(
      '[data-tour="guardar-auditoria"]',
      "22. Guardar auditoría",
      "Una vez que hayas completado todos los campos del formulario de registro de auditoría, presiona este botón para guardar la auditoría en el Plan Anual de Auditoría.",
      {
        onNextClick: avanzarDespuesDe(SELECTORES.botonCancelarAuditoria, callbacks.cancelarAuditoria, 300),
      }
    ),
    paso(
      '[data-tour="descargar-plantilla"]',
      "23. Descargar Plantilla",
      "Con este botón puedes descargar la plantilla definida para el cargue masivo de auditorías. Asegúrate de llenar la plantilla correctamente antes de subirla al sistema."
    ),
    paso(
      SELECTORES.botonCargueMasivo,
      "24. Cargue Masivo",
      "Con este botón puedes continuar con el registro de auditorías mediante el cargue masivo de la plantilla descargada previamente.",
      { onNextClick: avanzarDespuesDe(SELECTORES.botonCargueMasivo, callbacks.abrirCargueMasivo, 300) }
    ),
    paso(
      '[data-tour="form-cargue-archivo"]',
      "25. Adjuntar Plantilla para Cargue Masivo",
      "Aquí puedes adjuntar la plantilla previamente descargada y completada para realizar el cargue masivo de auditorías al Plan Anual de Auditoría."
    ),
    paso(
      '[data-tour="boton-subir-archivo"]',
      "26. Subir Plantilla para Cargue Masivo",
      "Aquí puedes adjuntar la plantilla previamente descargada y completada para realizar el cargue masivo de auditorías al Plan Anual de Auditoría.",
      { onNextClick: avanzarDespuesDe(SELECTORES.botonCancelarCargue, callbacks.cancelarCargueMasivo, 300) }
    ),
    paso(
      '[data-tour="ver-paa-pdf"]',
      "27. Visualizar Plan Anual de Auditoría en PDF",
      "Con este botón puedes visualizar el Plan Anual de Auditoría en formato PDF, lo que te permite revisar el documento completo a partir de la información diligenciada en el formulario."
    ),
    paso(
      '[data-tour="guardar-auditorias"]',
      "28. Guardar Auditorías",
      "Una vez que hayas registrado todas las auditorías correspondientes al Plan Anual de Auditoría, presiona este botón para guardar la información y finalizar el registro de auditorías."
    ),
    paso(
      '[data-tour="exportar-auditorias"]',
      "29. Exportar Auditorías",
      "Con este botón puedes exportar todo el listado de las auditorías registradas en el Plan Anual de Auditoría en un formato xlsx."
    ),
    paso(
      '[data-tour="eliminar-auditorias-masiva"]',
      "30. Eliminar Auditorías Masivamente",
      "Con este botón puedes eliminar todas las auditorías registradas en el Plan Anual de Auditoría de manera masiva. Ten en cuenta que esta acción es irreversible, así que asegúrate de que realmente deseas eliminar todas las auditorías antes de proceder."
    ),
    paso(
      '[data-tour="regresar-marco-general"]',
      "31. Regresar a la lista de PAA",
      "Para continuar con la tercera y última parte del registro del Plan Anual de Auditoría, regresa a la lista de planes y procede a enviar el plan a aprobación para que sea revisado por el Jefe de la Oficina de Control Interno.",
      { side: "left", onNextClick: () => callbacks.volverALista("next") }
    ),
    paso(
      'div[role="menu"] button:nth-child(3)',
      "32. Enviar Aprobación del PAA",
      "Finalmente una vez diligenciada toda la información del Plan Anual de Auditoría y registradas todas las auditorías correspondientes, puedes enviar el plan a aprobación para que sea revisado por el Jefe de la Oficina de Control Interno."
    ),
  ];
}
