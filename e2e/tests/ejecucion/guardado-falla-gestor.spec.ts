// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasInternasPage, InformeAuditoriaPage } from '../../pages/auditorias-internas.page';
import { SEMILLA_EDICION_INFORME as SEMILLA, VIGENCIA_SEMILLA } from './datos';
import { HTML_DESCRIPCION_CON_IMAGEN, PNG_1PX, simularGestorConDocumento, simularSubidaGestorFallida } from './gestor';

test('si la imagen de un tema nuevo no se puede subir al gestor, el guardado lo informa y no avanza ni dice "Guardado exitoso"', { tag: ['@ejecucion', '@auditor', '@simulado', '@lectura'] }, async ({ page }, testInfo) => {
  const ejecucion = new AuditoriasInternasPage(page, 'ejecucion');
  const informe = new InformeAuditoriaPage(page);
  await simularGestorConDocumento(page, HTML_DESCRIPCION_CON_IMAGEN);
  const intentos = await simularSubidaGestorFallida(page);
  // Los PUT de lo que ya existe en la semilla (tema, subtema y hallazgo) se responden como exitosos,
  // para que el único fallo sea la subida de la imagen nueva
  await page.route((url) => /\/plan_anual_auditoria_crud\/v1\/(tema|subtema|hallazgo)\/[0-9a-f]{24}$/.test(url.pathname), (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ Success: true, Status: 200, Data: {} }) })
      : route.fallback());
  const postsTema: string[] = [];
  page.on('request', (r) => { if (r.method() === 'POST' && /\/plan_anual_auditoria_crud\/v1\/tema$/.test(new URL(r.url()).pathname)) postsTema.push(r.url()); });
  const nombre = 'TEMA NUEVO CON IMAGEN E2E';

  await test.step(`el auditor abre el preinforme de "${SEMILLA.titulo}" y agrega un tema con imagen`, async () => {
    await ejecucion.abrir();
    await ejecucion.elegirVigencia(VIGENCIA_SEMILLA);
    const fila = ejecucion.filaAuditoria(SEMILLA.titulo);
    await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
    await ejecucion.accion(fila, 'Editar Preinforme');
    await informe.esperarCarga();
    await informe.irAAspectos();
    await informe.agregarTemaConImagen(nombre, { name: 'evidencia.png', mimeType: 'image/png', buffer: Buffer.from(PNG_1PX, 'base64') });
  });

  await test.step('al "Guardar y continuar", el modal dice qué tema no se guardó y por qué', async () => {
    await informe.guardarYContinuarAspectos();
    const texto = await informe.textoAlerta();
    // La captura espera a que el modal termine su animación de entrada
    await expect.poll(() => informe.alerta.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    await testInfo.attach('modal de guardado con fallos', { body: await page.screenshot(), contentType: 'image/png' });
    expect(texto).toContain('No se guardó todo');
    expect(texto).toContain(`Tema "${nombre}": no se pudo guardar la imagen de la descripción en el gestor documental`);
    expect(texto).not.toContain('Guardado exitoso');
    expect(intentos, 'el MF intentó subir la imagen una vez').toHaveLength(1);
    expect(postsTema, 'el tema no se crea sin su imagen').toEqual([]);
    await informe.confirmarAlerta();
  });

  await test.step('se queda en el paso 3 con el tema escrito, para reintentarlo', async () => {
    await expect(informe.pasoAspectos).toHaveAttribute('aria-selected', 'true');
    await expect(informe.alerta).toBeHidden();
    const ultimo = (await informe.temas.count()) - 1;
    expect(await informe.nombreTema(ultimo)).toBe(nombre);
    await expect(informe.editorDescripcion(ultimo).locator('img')).toHaveCount(1);
  });
});
