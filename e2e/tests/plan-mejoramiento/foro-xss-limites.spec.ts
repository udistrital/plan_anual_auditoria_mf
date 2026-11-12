// spec: e2e/specs/foro-accion.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';
import { ApiForo, marcadorE2E } from './foro-api';

// @escritura: publica mensajes reales con contenido hostil y en los límites. Corre contra el CRUD y el MID LOCALES.
// Todo lleva el marcador E2E y se borra de forma lógica al final, aunque el escenario falle.
test('el foro muestra como texto el HTML y los scripts, respeta saltos de línea y emojis, el límite de 1000 y el doble clic', { tag: ['@plan-mejoramiento', '@auditor', '@escritura'] }, async ({ page, request, limpieza }, testInfo) => {
  const registro = await abrirAccion(page, 'revisar');
  const foro = registro.foro;
  const accionId = page.url().match(/(?:registrar-avances|revisar)\/([0-9a-f]{24})/)![1];
  const api = new ApiForo(request, page);
  const marca = marcadorE2E();

  await api.liberarAccion(accionId);
  limpieza.registrar('borrar los comentarios E2E de la acción', () => api.liberarAccion(accionId));
  await registro.abrirForo();

  await test.step('el HTML y el script publicados se muestran como texto y no se ejecutan', async () => {
    const hostil = `${marca} hostil <script>window.__xss=1</script><img src=x onerror="window.__xss=1"> <b>negrita</b>`;
    await foro.enviar(hostil);
    const publicado = foro.mensajesCon(`${marca} hostil`);
    await expect(publicado).toHaveCount(1);
    const cuerpo = publicado.locator('.mensaje-texto');
    await expect(cuerpo).toContainText('<script>window.__xss=1</script>');
    await expect(cuerpo).toContainText('<b>negrita</b>');
    // Solo el texto del mensaje: la cabecera lleva el nombre del autor en <b> legítimamente
    await expect(cuerpo.locator('img, script, b')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    // También después de leerlo de nuevo desde la base
    await foro.actualizar();
    await expect(foro.mensajesCon(`${marca} hostil`).locator('.mensaje-texto').locator('img, script, b')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    await testInfo.attach('html mostrado como texto', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('los saltos de línea, las tildes y los emojis se conservan', async () => {
    await foro.enviar(`${marca} formato\nsegunda línea: ñandú, ¿qué?, café ☕ 😀`);
    const cuerpo = foro.mensajesCon(`${marca} formato`).locator('.mensaje-texto');
    await expect(cuerpo).toHaveCount(1);
    const texto = await cuerpo.innerText();
    expect(texto).toContain('\n');
    expect(texto).toContain('segunda línea: ñandú, ¿qué?, café ☕ 😀');
  });

  await test.step('un mensaje de exactamente 1000 caracteres se acepta y el contador marca el límite', async () => {
    const exacto = `${marca} límite `.padEnd(1000, 'x');
    expect(exacto.length).toBe(1000);
    await foro.campo.fill(exacto);
    await expect(foro.contador).toHaveText('1000/1000');
    await expect(foro.botonEnviar).toBeEnabled();
    await foro.enviar(exacto);
    await expect(foro.mensajesCon(`${marca} límite`)).toHaveCount(1);
  });

  await test.step('no se puede enviar un mensaje de más de 1000 caracteres', async () => {
    await foro.campo.fill(`${marca} ${'y'.repeat(1100)}`);
    const longitud = (await foro.campo.inputValue()).length;
    expect(longitud, 'el campo no debe aceptar más de 1000 caracteres').toBeLessThanOrEqual(1000);
    await foro.campo.fill('');
  });

  await test.step('un doble clic en Enviar crea un solo mensaje y una sola petición', async () => {
    let posts = 0;
    page.on('request', (r) => {
      if (r.method() === 'POST' && /\/accion-mejora\/[0-9a-f]{24}\/comentario/.test(r.url())) posts++;
    });
    const texto = `${marca} doble clic`;
    await foro.campo.fill(texto);
    await foro.botonEnviar.dblclick();
    await expect(foro.campo).toHaveValue('');
    await expect(foro.mensajesCon(texto)).toHaveCount(1);
    expect(posts, 'peticiones POST por el doble clic').toBe(1);
    const guardados = (await api.activosE2E(accionId)).filter((c) => c.mensaje.includes('doble clic'));
    expect(guardados, 'comentarios guardados por el doble clic').toHaveLength(1);
  });
});
