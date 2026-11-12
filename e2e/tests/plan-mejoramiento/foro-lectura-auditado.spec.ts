// spec: e2e/specs/foro-accion.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

test('el auditado abre el foro de su acción y puede redactar, sin el aviso de construcción', { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = await abrirAccion(page, 'registrar-avances');
  const foro = registro.foro;

  await test.step('el botón Foro abre el panel y lee los mensajes del MID', async () => {
    await registro.abrirForo();
    await expect(foro.titulo).toBeVisible();
    await expect(foro.avisoEnConstruccion).toHaveCount(0);
  });

  await test.step('hay mensajes con autor, rol y fecha, o el aviso de foro vacío', async () => {
    if (await foro.mensajes.count()) {
      const cabecera = await foro.cabecera(foro.mensajes.first());
      // «Nombre · Rol [· Dependencia] dd/MM/yyyy hh:mm AM|PM»
      expect(cabecera).toMatch(/ · .+\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} (AM|PM)$/);
    } else {
      await expect(foro.vacio).toBeVisible();
    }
  });

  await test.step('la dependencia responsable puede redactar; Enviar se habilita con texto y cuenta los caracteres', async () => {
    await expect(foro.campo).toBeVisible();
    await expect(foro.soloLectura).toHaveCount(0);
    await expect(foro.botonEnviar).toBeDisabled();
    await foro.campo.fill('Mensaje de prueba sin enviar');
    await expect(foro.botonEnviar).toBeEnabled();
    await expect(foro.contador).toHaveText('28/1000');
    await testInfo.attach('foro del auditado', { body: await page.screenshot(), contentType: 'image/png' });
  });

  expect(escriturasBloqueadas).toEqual([]);
});
