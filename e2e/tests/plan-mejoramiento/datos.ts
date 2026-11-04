/**
 * Datos semilla de los escenarios de registro de avances (ver specs/registro-avances.plan.md).
 * Se usan acciones existentes del ambiente de pruebas; los escenarios no crean ni modifican datos.
 */
import { expect, type Page } from '@playwright/test';
import { GestionAccionesPage } from '../../pages/gestion-acciones.page';
import { RegistroAvancesPage, type VarianteRegistro } from '../../pages/registro-avances.page';

/** Vigencia con acciones de planes aprobados en el ambiente de pruebas. */
export const VIGENCIA = process.env['E2E_VIGENCIA'] || '2026';

export const OPCION_MENU: Record<VarianteRegistro, string> = {
  'registrar-avances': 'Registrar Avances',
  revisar: 'Revisar y calificar',
};

/**
 * Abre la acción de E2E_ACCION_ID si está definida; si no, entra desde el listado de Gestión de
 * acciones a la primera acción de la vigencia, como lo haría el usuario, y verifica la opción del menú.
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
  await listado.elegirVigencia(VIGENCIA);
  await expect(listado.filas.first(), `la vigencia ${VIGENCIA} no tiene acciones en el ambiente de pruebas`).toBeVisible();
  expect(await listado.abrirMenuFila(listado.filas.first())).toContain(OPCION_MENU[variante]);
  await listado.elegirPrimeraOpcion();
  await registro.esperarCarga();
  await expect(page).toHaveURL(new RegExp(`/gestion-acciones/${variante}/[0-9a-f]{24}$`));
  return registro;
}
