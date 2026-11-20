// spec: e2e/specs/auditorias-externas.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasExternasPage } from '../../pages/auditorias-externas.page';

test('el registro de una auditoría externa es una sola pantalla con tres secciones', { tag: ['@auditorias-externas', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = new AuditoriasExternasPage(page);

  await test.step('al abrir el registro se ven las secciones Información general, Informe final y Hallazgos, en ese orden', async () => {
    await registro.abrirRegistro();
    await expect(registro.titulosDeSeccion()).toHaveText(['Información general', 'Informe final', 'Hallazgos']);
    await testInfo.attach('registro en una sola pantalla', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('no hay pasos (stepper) ni los botones de paso', async () => {
    await expect(registro.stepper).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Guardar y Continuar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Volver', exact: true })).toHaveCount(0);
  });

  await test.step('están los botones Cancelar y Continuar', async () => {
    await expect(registro.botonCancelar).toBeVisible();
    await expect(registro.botonContinuar).toBeVisible();
  });

  expect(escriturasBloqueadas).toEqual([]);
});
