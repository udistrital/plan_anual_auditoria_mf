// spec: e2e/specs/foro-accion.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';
import { ApiForo, marcadorE2E } from './foro-api';

// @escritura: crea comentarios reales. Corre contra el CRUD y el MID LOCALES (o en pruebas solo con aprobación
// del equipo). Lo que crea lleva el marcador E2E y se borra de forma lógica al final, aunque el escenario falle.
test('el auditor publica un mensaje en el foro y lo ve con su autor y rol tras actualizar', { tag: ['@plan-mejoramiento', '@auditor', '@escritura'] }, async ({ page, request, limpieza }, testInfo) => {
  const registro = await abrirAccion(page, 'revisar');
  const foro = registro.foro;
  const accionId = page.url().match(/registrar-avances\/([0-9a-f]{24})|revisar\/([0-9a-f]{24})/)!.slice(1).find(Boolean)!;
  const api = new ApiForo(request, page);
  const texto = `${marcadorE2E()} mensaje de prueba del foro`;

  await test.step('pre-limpieza: la acción no tiene comentarios de E2E de otras corridas', async () => {
    await api.liberarAccion(accionId);
  });

  let comentarioId = '';
  await test.step('el auditor abre el foro y publica un mensaje', async () => {
    await registro.abrirForo();
    await expect(foro.campo).toBeVisible();
    comentarioId = await foro.enviar(texto);
    limpieza.registrar(`borrar comentario ${comentarioId}`, () => api.borrar(comentarioId));
    await expect(foro.campo).toHaveValue('');
  });

  await test.step('el mensaje aparece con autor, rol de Auditor y fecha', async () => {
    const publicado = foro.mensajesCon(texto);
    await expect(publicado).toHaveCount(1);
    expect(await foro.cabecera(publicado)).toMatch(/ · (Auditor|Auditor Experto|Auditor Asistente) .*\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} (AM|PM)$/);
    await testInfo.attach('mensaje publicado', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('al cerrar, abrir de nuevo y actualizar, el mensaje persiste (viene de la base, no de la memoria)', async () => {
    await foro.botonCerrar.click();
    await expect(foro.dialogo).toBeHidden();
    await registro.abrirForo();
    await foro.actualizar();
    await expect(foro.mensajesCon(texto)).toHaveCount(1);
  });

  await test.step('el CRUD lo guardó asociado a la acción y activo', async () => {
    const guardados = await api.activosE2E(accionId);
    expect(guardados.map((c) => c._id)).toContain(comentarioId);
  });
});
