// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasInternasPage, InformeAuditoriaPage } from '../../pages/auditorias-internas.page';
import { SEMILLA_EDICION_INFORME as SEMILLA, VIGENCIA_SEMILLA } from './datos';
import { HTML_DESCRIPCION_CON_IMAGEN, simularGestorConDocumento } from './gestor';

test('el editor muestra la imagen de la descripción del tema y guardar sin cambios no la vuelve a subir', { tag: ['@ejecucion', '@auditor', '@simulado', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const ejecucion = new AuditoriasInternasPage(page, 'ejecucion');
  const informe = new InformeAuditoriaPage(page);
  const descargas = await simularGestorConDocumento(page, HTML_DESCRIPCION_CON_IMAGEN);

  await test.step(`el auditor abre el preinforme en creación de "${SEMILLA.titulo}"`, async () => {
    await ejecucion.abrir();
    await ejecucion.elegirVigencia(VIGENCIA_SEMILLA);
    const fila = ejecucion.filaAuditoria(SEMILLA.titulo);
    await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
    await ejecucion.accion(fila, 'Editar Preinforme');
    await informe.esperarCarga();
  });

  await test.step('el paso 3 carga la descripción desde el gestor con su texto y su imagen', async () => {
    await informe.irAAspectos();
    await expect(informe.temas).toHaveCount(1);
    const editor = informe.editorDescripcion(0);
    await expect(editor).toContainText('Evidencia fotográfica del hallazgo');
    await expect(editor.locator('img[src^="data:image/png;base64,"]')).toHaveCount(1);
    await expect(informe.avisoDescripcionNoDisponible(0)).toHaveCount(0);
    expect(descargas, 'el MF descargó la descripción del tema una vez').toHaveLength(1);
    await testInfo.attach('paso 3 con la imagen del tema', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('al guardar sin cambios, el tema reutiliza su enlace de Nuxeo', async () => {
    const putTema = page.waitForRequest((r) => r.method() === 'PUT' && /\/tema\/[0-9a-f]{24}$/.test(new URL(r.url()).pathname));
    await informe.guardarAspectos();
    const cuerpo = (await putTema).postDataJSON();
    expect(cuerpo).toEqual({ titulo: SEMILLA.tema, descripcion_titulo: SEMILLA.enlaceDescripcion });
  });

  expect(escriturasBloqueadas.some((e) => /gestor_documental/.test(e)), 'no vuelve a subir la descripción a Nuxeo').toBe(false);
});
