// spec: e2e/specs/foro-accion.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

// @simulado: la lectura del foro responde 25 mensajes inventados, paginados de 20 en 20 como el MID.
test('el foro carga los 20 más recientes y «Ver anteriores» trae el resto en orden cronológico', { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura', '@simulado'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = await abrirAccion(page, 'registrar-avances');
  const foro = registro.foro;
  await foro.simularLista(25);

  await test.step('al abrir se ven los 20 más recientes y el botón indica cuántos faltan', async () => {
    await registro.abrirForo();
    await expect(foro.mensajes).toHaveCount(20);
    await expect(foro.botonVerAnteriores).toHaveText('Ver anteriores (5)');
    await expect(foro.mensajes.first()).toContainText('Mensaje simulado 06');
    await expect(foro.mensajes.last()).toContainText('Mensaje simulado 25');
  });

  await test.step('Ver anteriores agrega los 5 más antiguos arriba y el botón desaparece', async () => {
    await foro.botonVerAnteriores.click();
    await expect(foro.mensajes).toHaveCount(25);
    await expect(foro.botonVerAnteriores).toHaveCount(0);
    await expect(foro.mensajes.first()).toContainText('Mensaje simulado 01');
    await expect(foro.mensajes.last()).toContainText('Mensaje simulado 25');
    await testInfo.attach('foro con 25 mensajes', { body: await page.screenshot(), contentType: 'image/png' });
  });

  expect(escriturasBloqueadas).toEqual([]);
});
