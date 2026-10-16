import { type DriveStep } from "driver.js";

export const TOUR_RETORNO_LISTA_KEY = "paa-tour-retorno-lista";

/** Páginas del tour entre las que se puede retroceder. */
export type PaginaTour = "marco-general" | "registrar-auditorias";

const SELECTORES = {
  acciones: 'div[role="menu"]',
  botonAcciones: '[data-tour="nuevo-paa"] tbody tr:nth-child(1) td:last-child button',
  botonEditarMarco: 'div[role="menu"] button:nth-child(1)',
  botonRegistrarAuditorias: 'div[role="menu"] button:nth-child(2)',
  botonAgregarAuditoria: '[data-tour="add-auditoria"]',
  botonCancelarAuditoria: '[data-tour="cancelar-auditoria"]',
  botonCargueMasivo: '[data-tour="cargue-masivo"]',
  botonCancelarCargue: '[data-tour="boton-cancelar-archivo"]',
  // Botón de la cabecera de ambas páginas del tour, es el paso al que se vuelve.
  botonRegresarPagina: '[data-tour="regresar-marco-general"]',
};

export function crearPasosTour(
  navegar: (commands: string[]) => Promise<boolean>,
  avanzar: () => void,
  retrocederA: (pagina: PaginaTour, selector: string) => void,
  retroceder: () => void,
): DriveStep[] {
  return [
    {
      element: '[data-tour="crear-paa"]',
      popover: {
        title: "1. Crear el Plan Anual de Auditoría",
        description: "Selecciona el año de vigencia y presiona este botón para iniciar el registro del PAA.",
      },
    },
    {
      element: '[data-tour="nuevo-paa"] tbody tr:nth-child(1)',
      popover: {
        title: "2. Nuevo Plan Anual de Auditoría creado",
        description: "Este es un plan de demostración que te guiará a través de las acciones disponibles para un PAA en estado Borrador.",
        onNextClick: () => {
          const boton = document.querySelector(SELECTORES.botonAcciones) as HTMLElement | null;
          if (!boton) return;

          boton.click();
          setTimeout(avanzar, 0);
        },
      },
    },
    {
      element: SELECTORES.acciones,
      popover: {
        title: "3. Acciones disponibles para el PAA",
        description: "Aquí puedes ver las acciones que puedes realizar sobre el Plan Anual de Auditoría en estado Borrador. Por ejemplo, puedes ver el marco general, editarlo, registrar auditorías y enviar el plan a aprobación.",
        side: "left",
      },
    },
    {
      element: SELECTORES.botonEditarMarco,
      popover: {
        title: "4. Editar el marco general del PAA",
        description: "Esta acción te permite modificar el marco general del PAA, como su Objetivo, Alcance, Criterios y Recursos. Recuerda que solo puedes editar el marco general mientras el PAA esté en estado Borrador.",
        side: "left",
        onNextClick: () => {
          const boton = document.querySelector(SELECTORES.botonEditarMarco) as HTMLElement | null;
          if (!boton) return;

          boton.click();
          setTimeout(avanzar, 300);
        },
      },
    },
    {
      element: '[data-tour="formulario-marco-general"]',
      popover: {
        title: "5. Marco general del PAA",
        description: "Aquí puedes ver y editar los detalles del marco general del PAA. Una vez que hayas terminado de editar, puedes guardar los cambios y regresar a la lista de planes. Es importante mencionar que la información en los campos del formulario está parametrizada en el sistema cuando se crea un nuevo registro como se muestra en la vista, pero puedes editar información si lo requieres.",
        onPrevClick: () => {
          sessionStorage.setItem(TOUR_RETORNO_LISTA_KEY, "previous");
          navegar(["/programacion/plan-auditoria"]);
        },
      },
    },
    {
      element: '[data-tour="formulario-marco-general"] form div div:nth-child(1) mat-form-field div:nth-child(1)',
      popover: {
        title: "6. Objetivo del Marco general del PAA",
        description: "Este campo permite definir el objetivo del Plan Anual de Auditoría, es decir, la finalidad que se busca alcanzar con la planificación y ejecución de las auditorías durante el año seleccionado.",
      },
    },
    {
      element: '[data-tour="formulario-marco-general"] form div div:nth-child(2) mat-form-field div:nth-child(1)',
      popover: {
        title: "7. Alcance del Marco general del PAA",
        description: "Este campo permite definir el alcance del Plan Anual de Auditoría, es decir, los límites y la extensión de las auditorías que se llevarán a cabo durante el año seleccionado.",
      },
    },
    {
      element: '[data-tour="formulario-marco-general"] form div div:nth-child(3) mat-form-field div:nth-child(1)',
      popover: {
        title: "8. Criterios del Marco general del PAA",
        description: "Este campo permite definir los criterios que se utilizarán para evaluar y medir el desempeño de las auditorías realizadas durante el año seleccionado.",
      },
    },
    {
      element: '[data-tour="formulario-marco-general"] form div div:nth-child(4) mat-form-field div:nth-child(1)',
      popover: {
        title: "9. Recursos del Marco general del PAA",
        description: "Este campo permite definir los recursos necesarios para llevar a cabo las auditorías planificadas en el Plan Anual de Auditoría, incluyendo personal, tiempo, presupuesto y herramientas.",
      },
    },
    {
      element: '[data-tour="guardar-marco-general"]',
      popover: {
        title: "10. Guardar cambios del Marco general del PAA",
        description: "Una vez que hayas realizado los cambios necesarios en el marco general del PAA, puedes presionar este botón para guardar la información y regresar a la lista de planes.",
        side: "left",
      },
    },
    {
      element: SELECTORES.botonRegresarPagina,
      popover: {
        title: "11. Regresar a la lista de PAA",
        description: "Para continuar con la segunda parte del registro del Plan Anual de Auditoría, regresa a la lista de planes y selecciona el plan que acabas de crear para registrar las auditorías correspondientes.",
        side: "left",
        onNextClick: () => {
          sessionStorage.setItem(TOUR_RETORNO_LISTA_KEY, "next");
          navegar(["/programacion/plan-auditoria"]);
        },
      },
    },
    {
      element: SELECTORES.botonRegistrarAuditorias,
      popover: {
        title: "12. Registrar auditorías del PAA",
        description: "Esta acción te permite registrar las auditorías correspondientes al Plan Anual de Auditoría.",
        side: "left",
        onPrevClick: () => retrocederA("marco-general", SELECTORES.botonRegresarPagina),
        onNextClick: () => {
          const boton = document.querySelector(SELECTORES.botonRegistrarAuditorias) as HTMLElement | null;
          if (!boton) return;

          boton.click();
          setTimeout(avanzar, 300);
        },
      },
    },
    {
      element: SELECTORES.botonAgregarAuditoria,
      popover: {
        title: "13. Añadir Auditoría",
        description: "Debes de dar click en este botón para añadir una nueva auditoría al Plan Anual de Auditoría. Recuerda que puedes añadir todas las auditorías que sean necesarias para cumplir con el objetivo del plan.",
        side: "left",
        onPrevClick: () => {
          sessionStorage.setItem(TOUR_RETORNO_LISTA_KEY, "previous");
          navegar(["/programacion/plan-auditoria"]);
        },
        onNextClick: () => {
          const boton = document.querySelector(SELECTORES.botonAgregarAuditoria) as HTMLElement | null;
          if (!boton) return;

          boton.click();
          setTimeout(avanzar, 300);
        },
      },
    },
    {
      element: '[data-tour="form-add-auditoria"]',
      popover: {
        title: "14. Formulario de registro de auditoría",
        description: "Aquí puedes registrar la información de la auditoría que deseas añadir al Plan Anual de Auditoría. Completa todos los campos requeridos y presiona el botón de guardar para añadir la auditoría al plan.",
      },
    },
    {
      element: '[data-tour="form-add-auditoria"] form div div:nth-child(1)',
      popover: {
        title: "15. Nombre de la auditoría",
        description: "Este campo permite definir el nombre de la auditoría que se va a registrar en el Plan Anual de Auditoría.",
      },
    },
    {
      element: '[data-tour="form-tipo-evaluacion-auditoria"]',
      popover: {
        title: "16. Tipo de evaluación",
        description: "Este campo permite seleccionar el tipo de evaluación que se va a realizar en la auditoría, ya sea una auditoría interna, un seguimiento o un informe de ley.",
      },
    },
    {
      element: '[data-tour="form-macroprocesos-auditoria"]',
      popover: {
        title: "17. Macroprocesos",
        description: "Este campo permite seleccionar los macroprocesos que se van a auditar en la auditoría. Puedes seleccionar uno o varios macroprocesos según corresponda.",
      },
    },
    {
      element: '[data-tour="form-add-auditoria"] form div div:nth-child(4)',
      popover: {
        title: "18. Procesos",
        description: "Este campo permite seleccionar los procesos que se van a auditar en la auditoría. Puedes seleccionar uno o varios procesos según corresponda. Importante seleccionar primero macroprocesos para que se habiliten los procesos correspondientes.",
      },
    },
    {
      element: '[data-tour="form-add-auditoria"] form div div:nth-child(5)',
      popover: {
        title: "19. Dependencias",
        description: "Este campo permite seleccionar las dependencias que se van a auditar en la auditoría. Puedes seleccionar una o varias dependencias según corresponda.",
      },
    },
    {
      element: '[data-tour="form-add-auditoria"] form div div:nth-child(6)',
      popover: {
        title: "20. Cronograma de actividades",
        description: "Este campo permite seleccionar los meses en los que se van a realizar las actividades de la auditoría. Puedes seleccionar uno o varios meses según corresponda.",
      },
    },
    {
      element: '[data-tour="form-add-auditoria"] form div div:nth-child(7)',
      popover: {
        title: "21. Cantidad de Auditorías",
        description: "Este campo permite seleccionar la cantidad de auditorías que se van a realizar en el Plan Anual de Auditoría.",
      },
    },
    {
      element: '[data-tour="guardar-auditoria"]',
      popover: {
        title: "22. Guardar auditoría",
        description: "Una vez que hayas completado todos los campos del formulario de registro de auditoría, presiona este botón para guardar la auditoría en el Plan Anual de Auditoría.",
        onNextClick: () => {
          const boton = document.querySelector(SELECTORES.botonCancelarAuditoria) as HTMLElement | null;
          if (!boton) return;

          boton.click();
          setTimeout(avanzar, 300);
        },
      },
    },
    {
      element: '[data-tour="descargar-plantilla"]',
      popover: {
        title: "23. Descargar Plantilla",
        description: "Con este botón puedes descargar la plantilla definida para el cargue masivo de auditorías. Asegúrate de llenar la plantilla correctamente antes de subirla al sistema.",
        onPrevClick: () => {
          const boton = document.querySelector(SELECTORES.botonAgregarAuditoria) as HTMLElement | null;
          if (!boton) return;

          boton.click();
          setTimeout(retroceder, 300);
        },
      },
    },
    {
      element: SELECTORES.botonCargueMasivo,
      popover: {
        title: "24. Cargue Masivo",
        description: "Con este botón puedes continuar con el registro de auditorías mediante el cargue masivo de la plantilla descargada previamente.",
        onNextClick: () => {
          const boton = document.querySelector(SELECTORES.botonCargueMasivo) as HTMLElement | null;
          if (!boton) return;

          boton.click();
          setTimeout(avanzar, 300);
        },
      },
    },
    {
      element: '[data-tour="form-cargue-archivo"]',
      popover: {
        title: "25. Adjuntar Plantilla para Cargue Masivo",
        description: "Aquí puedes adjuntar la plantilla previamente descargada y completada para realizar el cargue masivo de auditorías al Plan Anual de Auditoría.",
      },
    },
    {
      element: '[data-tour="boton-subir-archivo"]',
      popover: {
        title: "26. Subir Plantilla para Cargue Masivo",
        description: "Aquí puedes adjuntar la plantilla previamente descargada y completada para realizar el cargue masivo de auditorías al Plan Anual de Auditoría.",
        onNextClick: () => {
          const boton = document.querySelector(SELECTORES.botonCancelarCargue) as HTMLElement | null;
          if (!boton) return;

          boton.click();
          setTimeout(avanzar, 300);
        },
      },
    },
    {
      element: '[data-tour="ver-paa-pdf"]',
      popover: {
        title: "27. Visualizar Plan Anual de Auditoría en PDF",
        description: "Con este botón puedes visualizar el Plan Anual de Auditoría en formato PDF, lo que te permite revisar el documento completo a partir de la información diligenciada en el formulario.",
        onPrevClick: () => {
          const boton = document.querySelector(SELECTORES.botonCargueMasivo) as HTMLElement | null;
          if (!boton) return;

          boton.click();
          setTimeout(retroceder, 300);
        },
      },
    },
    {
      element: '[data-tour="guardar-auditorias"]',
      popover: {
        title: "28. Guardar Auditorías",
        description: "Una vez que hayas registrado todas las auditorías correspondientes al Plan Anual de Auditoría, presiona este botón para guardar la información y finalizar el registro de auditorías.",
      },
    },
    {
      element: '[data-tour="exportar-auditorias"]',
      popover: {
        title: "29. Exportar Auditorías",
        description: "Con este botón puedes exportar todo el listado de las auditorías registradas en el Plan Anual de Auditoría en un formato xlsx.",
      },
    },
    {
      element: '[data-tour="eliminar-auditorias-masiva"]',
      popover: {
        title: "30. Eliminar Auditorías Masivamente",
        description: "Con este botón puedes eliminar todas las auditorías registradas en el Plan Anual de Auditoría de manera masiva. Ten en cuenta que esta acción es irreversible, así que asegúrate de que realmente deseas eliminar todas las auditorías antes de proceder.",
      },
    },
    {
      element: SELECTORES.botonRegresarPagina,
      popover: {
        title: "31. Regresar a la lista de PAA",
        description: "Para continuar con la tercera y última parte del registro del Plan Anual de Auditoría, regresa a la lista de planes y procede a enviar el plan a aprobación para que sea revisado por el Jefe de la Oficina de Control Interno.",
        side: "left",
        onNextClick: () => {
          sessionStorage.setItem(TOUR_RETORNO_LISTA_KEY, "next");
          navegar(["/programacion/plan-auditoria"]);
        },
      },
    },
    {
      element: 'div[role="menu"] button:nth-child(3)',
      popover: {
        title: "32. Enviar Aprobación del PAA",
        description: "Finalmente una vez diligenciada toda la información del Plan Anual de Auditoría y registradas todas las auditorías correspondientes, puedes enviar el plan a aprobación para que sea revisado por el Jefe de la Oficina de Control Interno.",
        onPrevClick: () => retrocederA("registrar-auditorias", SELECTORES.botonRegresarPagina),
      },
    },
  ];
}
