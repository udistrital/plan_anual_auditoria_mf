// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasInternasPage, InformeAuditoriaPage } from '../../pages/auditorias-internas.page';
import { SEMILLA_PDF_IMAGEN as SEMILLA, VIGENCIA_SEMILLA } from './datos';
import { imagenesDelPdf } from './gestor';

// E4 · Punta a punta, sin simulación: la descripción del tema se descarga del gestor documental real y el MID
// desplegado genera el preinforme con la imagen. Solo lectura: "Ver informe preliminar" es un GET.
test('un preinforme real con imagen la muestra al editar y el MID la incluye en el PDF', { tag: ['@ejecucion', '@auditor', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  test.setTimeout(4 * 60_000);
  const ejecucion = new AuditoriasInternasPage(page, 'ejecucion');
  const informe = new InformeAuditoriaPage(page);

  await test.step(`el auditor abre el preinforme en creación de "${SEMILLA.titulo}"`, async () => {
    await ejecucion.abrir();
    await ejecucion.elegirVigencia(VIGENCIA_SEMILLA);
    const fila = ejecucion.filaAuditoria(SEMILLA.titulo);
    await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla E (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
    await ejecucion.accion(fila, 'Editar Preinforme');
    await informe.esperarCarga();
  });

  await test.step('el paso 3 descarga la descripción del gestor documental real, con su texto y su imagen', async () => {
    await informe.irAAspectos();
    await expect(informe.temas).toHaveCount(1);
    const editor = informe.editorDescripcion(0);
    // La descarga real puede tardar: se espera lo que se verifica, no el primer elemento fijo
    await expect(editor, 'si falla, revisar el gestor en WSO2 (401 / 404 JSON / 404 XML), no CORS').toContainText(SEMILLA.textoDescripcion, { timeout: 90_000 });
    await expect(editor.locator('img[src^="data:image/png;base64,"]')).toHaveCount(1);
    await expect(informe.avisoDescripcionNoDisponible(0)).toHaveCount(0);
    await testInfo.attach('paso 3 con la imagen descargada del gestor', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('"Ver informe preliminar": el MID genera el PDF con la imagen del tema', async () => {
    await informe.irAlResumen();
    const pdf = await informe.verInformePreliminar();
    await testInfo.attach('preinforme generado por el MID', { body: pdf, contentType: 'application/pdf' });
    await testInfo.attach('visor del preinforme', { body: await page.screenshot(), contentType: 'image/png' });
    expect(pdf.subarray(0, 5).toString('latin1'), 'la respuesta es un PDF').toBe('%PDF-');
    const imagenes = imagenesDelPdf(pdf);
    await testInfo.attach('imágenes del PDF', { body: JSON.stringify(imagenes), contentType: 'application/json' });
    expect(imagenes, `el PDF incluye la imagen de ${SEMILLA.imagen.ancho}×${SEMILLA.imagen.alto} px de la descripción`).toContainEqual(SEMILLA.imagen);
  });

  expect(escriturasBloqueadas, 'ver el preinforme no escribe').toEqual([]);
});
