// spec: e2e/specs/auditorias-externas.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasExternasPage } from '../../pages/auditorias-externas.page';
import { VIGENCIA_E2E } from '../programacion/datos';

test('el listado pide al MID las auditorías externas y Crear abre el registro con la vigencia', { tag: ['@auditorias-externas', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const listado = new AuditoriasExternasPage(page);

  await test.step('al abrir el listado, el MID responde 200 y se muestran las filas o el aviso de vacío', async () => {
    const esperando = listado.esperarListado();
    await listado.abrirListado();
    await esperando;
    await expect(listado.tituloListado).toBeVisible();
    await testInfo.attach('listado de auditorías externas', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step(`al elegir la vigencia ${VIGENCIA_E2E}, la tabla se vuelve a pedir filtrada por esa vigencia`, async () => {
    const peticion = page.waitForRequest((r) => r.method() === 'GET' && /\/auditoria-externa\?.*vigencia_id=\d+/.test(r.url()));
    const esperando = listado.esperarListado();
    await listado.elegirVigencia(VIGENCIA_E2E);
    await peticion;
    await esperando;
  });

  await test.step('Crear abre el registro con la vigencia elegida en la dirección', async () => {
    await listado.botonCrear.click();
    await expect(page).toHaveURL(/\/auditorias-externas\/registrar-auditoria\?vigencia=\d+/);
    await expect(listado.seccionInformacion).toBeVisible();
  });

  expect(escriturasBloqueadas).toEqual([]);
});
