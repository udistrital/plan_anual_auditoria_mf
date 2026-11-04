// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasInternasPage, InformeAuditoriaPage } from '../../pages/auditorias-internas.page';
import { SEMILLA_RESUMEN_HALLAZGOS as SEMILLA, VIGENCIA_SEMILLA } from './datos';

test('el resumen de hallazgos del preinforme muestra el hallazgo y no su descripción', { tag: ['@ejecucion', '@auditor', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const ejecucion = new AuditoriasInternasPage(page, 'ejecucion');
  const informe = new InformeAuditoriaPage(page);

  await test.step(`el auditor abre el preinforme de la auditoría semilla "${SEMILLA.titulo}"`, async () => {
    await ejecucion.abrir();
    await ejecucion.elegirVigencia(VIGENCIA_SEMILLA);
    const fila = ejecucion.filaAuditoria(SEMILLA.titulo);
    await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
    await ejecucion.accion(fila, 'Ver Preinforme');
    await informe.esperarCarga();
  });

  await test.step('el paso 4 lista cada hallazgo con su número, su criterio y el texto corto del campo Hallazgo', async () => {
    await informe.irAlResumen();
    await expect(informe.encabezadosResumen).toHaveText(['Número Hallazgo', 'Criterio', 'Descripción del Hallazgo']);
    await expect(informe.filasResumen).toHaveCount(SEMILLA.hallazgos.length);
    const filas = await informe.resumen();
    expect(filas).toEqual(SEMILLA.hallazgos.map((h, i) => ({ numero: `2.1.${i + 1}`, criterio: h.criterio, descripcion: h.titulo })));
    await testInfo.attach('resumen de hallazgos con el texto corto', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('la descripción larga del hallazgo no aparece en el resumen', async () => {
    for (const h of SEMILLA.hallazgos) await expect(informe.tablaResumen).not.toContainText(h.descripcion);
  });

  expect(escriturasBloqueadas).toEqual([]);
});
