// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasInternasPage, InformeAuditoriaPage } from '../../pages/auditorias-internas.page';
import { SEMILLA_EDICION_INFORME as SEMILLA, VIGENCIA_SEMILLA } from './datos';
import { HTML_DESCRIPCION_CON_IMAGEN, simularDescripcionHallazgos, simularGestorCaido, simularGestorConDocumento } from './gestor';

const ENLACE_HALLAZGO = 'NuxeoEnlace:00000000-0000-4000-8000-00000000e2e2';
const ETIQUETAS = { tag: ['@ejecucion', '@auditor', '@simulado', '@lectura'] };

async function abrirPreinforme(ejecucion: AuditoriasInternasPage, informe: InformeAuditoriaPage): Promise<void> {
  await ejecucion.abrir();
  await ejecucion.elegirVigencia(VIGENCIA_SEMILLA);
  const fila = ejecucion.filaAuditoria(SEMILLA.titulo);
  await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
  await ejecucion.accion(fila, 'Editar Preinforme');
  await informe.esperarCarga();
}

const putHallazgo = (r: { method(): string; url(): string }) =>
  r.method() === 'PUT' && /\/hallazgo\/[0-9a-f]{24}$/.test(new URL(r.url()).pathname);

test('el editor muestra la imagen de la descripción del hallazgo y guardar sin cambios conserva su enlace', ETIQUETAS, async ({ page, escriturasBloqueadas }, testInfo) => {
  const ejecucion = new AuditoriasInternasPage(page, 'ejecucion');
  const informe = new InformeAuditoriaPage(page);
  await simularGestorConDocumento(page, HTML_DESCRIPCION_CON_IMAGEN);
  await simularDescripcionHallazgos(page, ENLACE_HALLAZGO);

  await test.step(`el auditor abre el preinforme en creación de "${SEMILLA.titulo}"`, async () => {
    await abrirPreinforme(ejecucion, informe);
  });

  await test.step('el paso 3 carga en el editor el texto y la imagen del hallazgo', async () => {
    await informe.irAAspectos();
    const editor = informe.editorDescripcionHallazgo(0);
    await expect(editor).toContainText('Evidencia fotográfica del hallazgo');
    await expect(editor.locator('img[src^="data:image/png;base64,"]')).toHaveCount(1);
    await testInfo.attach('paso 3 con la imagen del hallazgo', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('al guardar sin cambios, el hallazgo reutiliza su enlace de Nuxeo', async () => {
    const put = page.waitForRequest(putHallazgo);
    await informe.guardarAspectos();
    expect((await put).postDataJSON().descripcion).toBe(ENLACE_HALLAZGO);
  });

  expect(escriturasBloqueadas.some((e) => /gestor_documental/.test(e)), 'no vuelve a subir la descripción a Nuxeo').toBe(false);
});

test('con el gestor documental caído, el hallazgo muestra un aviso y al guardar conserva su enlace', ETIQUETAS, async ({ page, escriturasBloqueadas }, testInfo) => {
  const ejecucion = new AuditoriasInternasPage(page, 'ejecucion');
  const informe = new InformeAuditoriaPage(page);
  await simularGestorCaido(page);
  await simularDescripcionHallazgos(page, ENLACE_HALLAZGO);

  await test.step(`el auditor abre el preinforme en creación de "${SEMILLA.titulo}"`, async () => {
    await abrirPreinforme(ejecucion, informe);
  });

  await test.step('avisa y deja el hallazgo visible, sin editor', async () => {
    await expect(informe.alerta).toBeVisible({ timeout: 60_000 });
    expect(await informe.textoAlerta()).toContain('1 hallazgo(s)');
    await informe.confirmarAlerta();

    await informe.irAAspectos();
    await expect(informe.avisoDescripcionHallazgoNoDisponible(0)).toBeVisible();
    await expect(informe.editorDescripcionHallazgo(0)).toHaveCount(0);
    await testInfo.attach('paso 3 con el gestor caído', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('al guardar, el hallazgo conserva su enlace de Nuxeo', async () => {
    const put = page.waitForRequest(putHallazgo);
    await informe.guardarAspectos();
    expect((await put).postDataJSON().descripcion).toBe(ENLACE_HALLAZGO);
  });

  expect(escriturasBloqueadas.some((e) => /gestor_documental/.test(e)), 'no intenta subir otra vez la descripción').toBe(false);
});
