/**
 * Datos semilla de los escenarios de Ejecución y Planeación (ver specs/estabilizacion-ejecucion.plan.md).
 * Los crea `tests/semillas/ejecucion-2010.spec.ts` en la vigencia de E2E y no se limpian.
 */
import { VIGENCIA_E2E } from '../programacion/datos';

export const VIGENCIA_SEMILLA = VIGENCIA_E2E;

/** Auditoría con el preinforme en revisión del Jefe: el auditor la abre con "Ver Preinforme". */
export const SEMILLA_RESUMEN_HALLAZGOS = {
  titulo: 'SEMILLA-E2E Resumen de hallazgos',
  consecutivo: process.env['E2E_AUDITORIA_CON_HALLAZGOS'] || 'SEMILLA-E2E-01',
  tema: 'TEMA SEMILLA E2E',
  subtema: 'SUBTEMA SEMILLA E2E',
  hallazgos: [
    {
      criterio: 'Resolución No. 129 de 2022 de la Rectoría',
      titulo: 'Rezago en el plaqueteo y legalización de bienes',
      descripcion:
        'Justificación: quedó en evidencia que varios equipos de cómputo permanecen almacenados y sin operar ' +
        'debido a la falta de asignación de sus placas de inventario. Texto largo de la semilla E2E.',
    },
    {
      criterio: 'Resolución DDC-000001 de 2019',
      titulo: 'Bienes sin placa en los laboratorios',
      descripcion:
        'Justificación: durante las visitas de inspección física se constató la existencia de instrumentos ' +
        'desprovistos de la placa de inventario institucional. Texto largo de la semilla E2E.',
    },
  ],
};

/**
 * Auditoría interna con el preinforme en creación: el auditor la edita ("Editar Preinforme"). Su tema
 * guarda la descripción en Nuxeo con un enlace ficticio: los escenarios simulan la respuesta del gestor.
 */
export const SEMILLA_EDICION_INFORME = {
  titulo: 'SEMILLA-E2E Edición de informe',
  consecutivo: 'SEMILLA-E2E-03',
  tema: 'TEMA CON IMAGEN SEMILLA E2E',
  enlaceDescripcion: 'NuxeoEnlace:00000000-0000-4000-8000-00000000e2e1',
  subtema: 'SUBTEMA SEMILLA E2E',
  hallazgo: {
    criterio: 'Resolución No. 129 de 2022 de la Rectoría',
    titulo: 'Hallazgo de la semilla de edición',
    descripcion: 'Descripción del hallazgo de la semilla de edición E2E.',
  },
};

/**
 * Auditoría interna con el preinforme en creación y un tema cuya descripción (texto + imagen de 37×23 px)
 * está guardada DE VERDAD en el gestor documental. Sin simulación: valida la descarga real y el PDF del MID.
 */
export const SEMILLA_PDF_IMAGEN = {
  titulo: 'SEMILLA-E2E PDF con imagen',
  consecutivo: 'SEMILLA-E2E-05',
  tema: 'TEMA PDF CON IMAGEN SEMILLA E2E',
  textoDescripcion: 'Evidencia fotográfica real de la semilla E2E del PDF.',
  imagen: { ancho: 37, alto: 23 },
  /** Paso 1 del informe: sin fecha de emisión el MID no genera el PDF. */
  informe: {
    fecha_emision: '2010-12-15T05:00:00.000Z',
    muestra: 'Muestra de la semilla E2E del PDF.',
    aspecto_general: '<p>Aspectos generales de la semilla E2E del PDF.</p>',
  },
  subtema: 'SUBTEMA PDF SEMILLA E2E',
  hallazgo: {
    criterio: 'Resolución No. 129 de 2022 de la Rectoría',
    titulo: 'Hallazgo de la semilla del PDF',
    descripcion: 'Descripción del hallazgo de la semilla del PDF E2E.',
  },
};

/** Seguimiento con el informe final en creación y sin temas: el auditor lo edita ("Editar Informe"). */
export const SEMILLA_SEGUIMIENTO = {
  titulo: 'SEMILLA-E2E Seguimiento',
  consecutivo: 'SEMILLA-E2E-04',
};

/** Auditoría con el programa de trabajo aprobado por el auditado: lista para "Iniciar Ejecución". */
export const SEMILLA_INICIAR_EJECUCION = {
  titulo: 'SEMILLA-E2E Iniciar ejecución',
  consecutivo: process.env['E2E_AUDITORIA_PROGRAMA_APROBADO'] || 'SEMILLA-E2E-02',
};
