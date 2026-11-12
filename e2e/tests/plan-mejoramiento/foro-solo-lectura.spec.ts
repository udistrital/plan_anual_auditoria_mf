// spec: e2e/specs/foro-accion.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

// @simulado: en los datos no hay una dependencia que llegue a la pantalla sin ser responsable de la acción,
// así que se reescribe MetaData.puede_comentar de la lectura. La regla real (403) la cubren los specs del MID.
test('quien no puede comentar ve el foro en solo lectura, sin área de redacción', { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura', '@simulado'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = await abrirAccion(page, 'registrar-avances');
  const foro = registro.foro;
  await foro.simularPuedeComentar(false);

  await test.step('el panel carga los mensajes y avisa que es solo lectura', async () => {
    await registro.abrirForo();
    await expect(foro.soloLectura).toBeVisible();
    await expect(foro.soloLectura).toContainText('dependencias responsables de la acción y el personal de Control Interno');
  });

  await test.step('no aparece el campo para escribir ni el botón Enviar', async () => {
    await expect(foro.campo).toHaveCount(0);
    await expect(foro.botonEnviar).toHaveCount(0);
    await testInfo.attach('foro en solo lectura', { body: await page.screenshot(), contentType: 'image/png' });
  });

  expect(escriturasBloqueadas).toEqual([]);
});
