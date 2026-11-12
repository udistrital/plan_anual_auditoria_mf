// spec: e2e/specs/foro-accion.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

// @simulado: el POST responde con errores inventados (no llega al backend ni al bloqueo de escrituras).
test('si el envío falla, el foro avisa sin exponer detalles técnicos y conserva el texto', { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura', '@simulado'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = await abrirAccion(page, 'registrar-avances');
  const foro = registro.foro;
  const respuestas = [
    { status: 400, cuerpo: { message: 'El mensaje no puede superar 1000 caracteres' } },
    { status: 500, cuerpo: { message: 'connect ECONNREFUSED 10.0.0.5:8080 detalle interno' } },
  ];
  let intento = 0;
  await foro.simularEnvio(() => respuestas[Math.min(intento++, respuestas.length - 1)]);
  const texto = 'Mensaje que no se puede enviar';

  await test.step('un 400 del MID muestra su mensaje y el texto sigue en el campo', async () => {
    await registro.abrirForo();
    await foro.campo.fill(texto);
    await foro.botonEnviar.click();
    await expect(foro.errorEnvio).toHaveText('El mensaje no puede superar 1000 caracteres');
    await expect(foro.campo).toHaveValue(texto);
    await expect(foro.botonEnviar).toBeEnabled();
  });

  await test.step('un 500 muestra un texto fijo, sin el detalle técnico, y el texto sigue ahí', async () => {
    await foro.botonEnviar.click();
    await expect(foro.errorEnvio).toHaveText('No se pudo enviar el comentario. Intente de nuevo.');
    await expect(foro.errorEnvio).not.toContainText('ECONNREFUSED');
    await expect(foro.campo).toHaveValue(texto);
    await testInfo.attach('error de envío', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('no se creó ningún mensaje', async () => {
    await expect(foro.mensajesCon(texto)).toHaveCount(0);
    expect(escriturasBloqueadas).toEqual([]);
  });
});
