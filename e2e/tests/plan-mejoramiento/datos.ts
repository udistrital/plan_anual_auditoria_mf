/**
 * Datos semilla de los escenarios de registro de avances (ver specs/registro-avances.plan.md).
 * Se usan acciones existentes del ambiente de pruebas; los escenarios no crean ni modifican datos.
 */
import { expect, type Page } from '@playwright/test';
import { GestionAccionesPage } from '../../pages/gestion-acciones.page';
import { RegistroAvancesPage, type VarianteRegistro } from '../../pages/registro-avances.page';

/** Vigencia donde se busca primero (E2E_VIGENCIA); si no hay acciones del rol, se buscan las anteriores. */
export const VIGENCIA = process.env['E2E_VIGENCIA'] || '2026';
/** Cuántas vigencias se revisan como máximo al buscar una acción del rol. */
const MAX_VIGENCIAS = 6;

/**
 * Opciones principales del menú de la fila que abren cada variante, en orden de preferencia (vistas por rol
 * de #916). Todas llevan a .../gestion-acciones/registrar-avances/:id; la vista la decide el rol:
 * - auditado: "Registrar Avances" (cargue abierto); si no hay, "Ver Calificación" o "Ver Acción", que abren
 *   la misma vista con el cargue bloqueado. Desde #916 el auditado solo ve las acciones de las que es responsable;
 * - auditor del plan: "Calificar" (en revisión OCI) o "Habilitar Cargue" (pendiente de habilitar).
 */
export const OPCIONES_MENU: Record<VarianteRegistro, string[]> = {
  'registrar-avances': ['Registrar Avances', 'Ver Calificación', 'Ver Acción'],
  revisar: ['Calificar', 'Habilitar Cargue'],
};

/**
 * Abre la acción de E2E_ACCION_ID si está definida; si no, entra desde el listado de Gestión de acciones, como lo
 * haría el usuario: en la vigencia VIGENCIA (o las anteriores), la primera acción que ofrece la opción preferida.
 */
export async function abrirAccion(page: Page, variante: VarianteRegistro): Promise<RegistroAvancesPage> {
  const registro = new RegistroAvancesPage(page);
  const accionId = process.env['E2E_ACCION_ID'];
  if (accionId) {
    await registro.abrir(accionId, variante);
    return registro;
  }
  const listado = new GestionAccionesPage(page);
  await listado.abrir();
  const disponibles = await listado.vigencias();
  const vigencias = [VIGENCIA, ...disponibles.filter((v) => v !== VIGENCIA)].slice(0, MAX_VIGENCIAS);
  const opciones = OPCIONES_MENU[variante];
  for (const vigencia of vigencias) {
    await listado.elegirVigencia(vigencia);
    if (!(await listado.filas.count())) continue;
    for (const opcion of opciones) {
      if (await listado.elegirFilaConOpcion([opcion])) {
        await registro.esperarCarga();
        await expect(page).toHaveURL(/\/gestion-acciones\/registrar-avances\/[0-9a-f]{24}$/);
        return registro;
      }
    }
  }
  throw new Error(
    `ninguna acción de las vigencias ${vigencias.join(', ')} ofrece ${opciones.join(' / ')} a este rol en el ambiente ` +
      '(desde #916 el auditado solo ve las acciones de las que es responsable). Fija E2E_ACCION_ID o crea el dato.',
  );
}
