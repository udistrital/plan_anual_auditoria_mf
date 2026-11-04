// spec: e2e/specs/registro-avances.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

test('el auditado consulta el registro de avances de una acción', { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = await test.step('entra desde Gestión de acciones con "Registrar Avances"', () => abrirAccion(page, 'registrar-avances'));

  await test.step('ve la variante del auditado', async () => {
    await expect(registro.tituloEvidencias).toHaveText('Evidencias de avance');
    await expect(registro.tituloCalificacion).toHaveText('Calificación de Control Interno');
    await expect(registro.formulario.raiz).toHaveCount(0);
    await expect(registro.botonCargue).toHaveCount(0);
    await expect(registro.stepper).toHaveCount(0);
    await expect(registro.chips).toContainText(/Cargue (habilitado|bloqueado)/);
    await expect(registro.botonAnadirDocumento).toBeVisible();
    await testInfo.attach('variante del auditado', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('la ficha abre en Acción, se recorre con flechas y se cierra con Esc', async () => {
    await registro.abrirFicha();
    expect(await registro.ficha.nombrePestanaActiva()).toBe('Acción');
    expect(await registro.ficha.recorrerConFlechas(4)).toEqual(['Hallazgo', 'Auditoría', 'Responsables', 'Acción']);
    await testInfo.attach('ficha de la acción', { body: await page.screenshot(), contentType: 'image/png' });
    await registro.ficha.cerrarConEscape();
  });

  await test.step('"Ver hallazgo" abre la ficha en Hallazgo', async () => {
    await registro.abrirFichaEnHallazgo();
    expect(await registro.ficha.nombrePestanaActiva()).toBe('Hallazgo');
    await registro.ficha.cerrar();
  });

  await test.step('a 390 px no hay desborde horizontal', async () => {
    await registro.cambiarAncho(390);
    await expect.poll(() => registro.anchoDocumento()).toBeLessThanOrEqual(390);
    await testInfo.attach('390 px', { body: await page.screenshot(), contentType: 'image/png' });
  });

  expect(escriturasBloqueadas).toEqual([]);
});
