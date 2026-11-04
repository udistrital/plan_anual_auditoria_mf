// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasInternasPage, InformeAuditoriaPage } from '../../pages/auditorias-internas.page';
import { SEMILLA_EDICION_INFORME as SEMILLA, VIGENCIA_SEMILLA } from './datos';
import { simularGestorCaido } from './gestor';

test('con el gestor documental caído, el paso 3 muestra los temas con un aviso y al guardar conserva la descripción', { tag: ['@ejecucion', '@auditor', '@simulado', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const ejecucion = new AuditoriasInternasPage(page, 'ejecucion');
  const informe = new InformeAuditoriaPage(page);
  const descargas = await simularGestorCaido(page);

  await test.step(`el auditor abre el preinforme en creación de "${SEMILLA.titulo}"`, async () => {
    await ejecucion.abrir();
    await ejecucion.elegirVigencia(VIGENCIA_SEMILLA);
    const fila = ejecucion.filaAuditoria(SEMILLA.titulo);
    await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
    await ejecucion.accion(fila, 'Editar Preinforme');
    await informe.esperarCarga();
  });

  await test.step('al no poder descargar la descripción, avisa y no deja el paso vacío', async () => {
    await expect(informe.alerta).toBeVisible({ timeout: 60_000 });
    expect(await informe.textoAlerta()).toContain('No se pudo cargar desde el gestor documental la descripción de 1 tema(s)');
    await informe.confirmarAlerta();
    expect(descargas, 'el MF intentó descargar la descripción del tema').toHaveLength(1);

    await informe.irAAspectos();
    await expect(informe.temas).toHaveCount(1);
    expect(await informe.nombreTema(0)).toBe(SEMILLA.tema);
    expect(await informe.conteoTema(0)).toEqual({ subtemas: 1, hallazgos: 1 });
    await expect(informe.avisoDescripcionNoDisponible(0)).toBeVisible();
    await expect(informe.editorDescripcion(0)).toHaveCount(0);
    await testInfo.attach('paso 3 con el gestor caído', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('al guardar, el tema conserva su enlace de Nuxeo (no se sobrescribe con vacío)', async () => {
    const putTema = page.waitForRequest((r) => r.method() === 'PUT' && /\/tema\/[0-9a-f]{24}$/.test(new URL(r.url()).pathname));
    await informe.guardarAspectos();
    const cuerpo = (await putTema).postDataJSON();
    await testInfo.attach('cuerpo del PUT del tema (bloqueado)', { body: JSON.stringify(cuerpo, null, 2), contentType: 'application/json' });
    expect(cuerpo).toEqual({ titulo: SEMILLA.tema, descripcion_titulo: SEMILLA.enlaceDescripcion });
  });

  expect(escriturasBloqueadas.some((e) => /^PUT .*\/tema\//.test(e)), 'la escritura del tema quedó bloqueada (@lectura)').toBe(true);
  expect(escriturasBloqueadas.some((e) => /gestor_documental/.test(e)), 'no intenta subir otra vez la descripción').toBe(false);
});
