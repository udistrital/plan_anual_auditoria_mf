// spec: e2e/specs/foro-accion.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

// Control Interno comenta aunque no esté asignado al plan (como en Sísifo v1). Si la cuenta no tiene acciones
// en su listado, fijar E2E_ACCION_ID: la ruta de Registro de avances abre la acción con cualquier rol.
test('el Jefe de Control Interno ve el área de redacción del foro de una acción', { tag: ['@plan-mejoramiento', '@jefe-oci', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = await abrirAccion(page, 'revisar');
  const foro = registro.foro;

  await test.step('el foro abre y lee los mensajes', async () => {
    await registro.abrirForo();
    await expect(foro.titulo).toBeVisible();
  });

  await test.step('el rol de Control Interno puede redactar, esté o no asignado al plan', async () => {
    await expect(foro.campo).toBeVisible();
    await expect(foro.soloLectura).toHaveCount(0);
    await foro.campo.fill('Mensaje de prueba sin enviar');
    await expect(foro.botonEnviar).toBeEnabled();
    await testInfo.attach('foro con redacción para Control Interno', { body: await page.screenshot(), contentType: 'image/png' });
  });

  expect(escriturasBloqueadas).toEqual([]);
});
