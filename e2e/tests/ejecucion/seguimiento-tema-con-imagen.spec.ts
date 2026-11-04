// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { InformeSeguimientoPage, SeguimientoInformesPage } from '../../pages/seguimiento-informes.page';
import { SEMILLA_SEGUIMIENTO as SEMILLA, VIGENCIA_SEMILLA } from './datos';
import { PNG_1PX, simularSubidaGestor } from './gestor';

const ENLACE_SUBIDO = '00000000-0000-4000-8000-00000000e2e3';

test('en seguimiento, un tema nuevo con imagen sube su descripción al gestor y se crea con el enlace de Nuxeo', { tag: ['@ejecucion', '@auditor', '@simulado', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const seguimientos = new SeguimientoInformesPage(page);
  const informe = new InformeSeguimientoPage(page);
  const subidos = await simularSubidaGestor(page, ENLACE_SUBIDO);

  await test.step(`el auditor abre el informe final en creación de "${SEMILLA.titulo}"`, async () => {
    await seguimientos.abrir();
    await seguimientos.elegirVigencia(VIGENCIA_SEMILLA);
    const fila = seguimientos.filaSeguimiento(SEMILLA.titulo);
    await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
    await seguimientos.accion(fila, 'Editar Informe');
    await informe.esperarCarga();
  });

  await test.step('agrega un tema con una imagen en su descripción', async () => {
    await informe.irAAspectos();
    await informe.agregarTemaConImagen('TEMA CON IMAGEN E2E', {
      name: 'evidencia.png', mimeType: 'image/png', buffer: Buffer.from(PNG_1PX, 'base64'),
    });
    await testInfo.attach('tema de seguimiento con imagen', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('al guardar, la descripción se sube al gestor y el tema se crea con su NuxeoEnlace', async () => {
    const postTema = page.waitForRequest((r) => r.method() === 'POST' && /\/plan_anual_auditoria_crud\/v1\/tema$/.test(new URL(r.url()).pathname));
    await informe.guardarAspectos();
    const cuerpo = (await postTema).postDataJSON();
    await testInfo.attach('cuerpo del POST del tema (bloqueado)', { body: JSON.stringify(cuerpo, null, 2), contentType: 'application/json' });

    expect(subidos, 'se subió un documento HTML al gestor').toHaveLength(1);
    expect(subidos[0].html).toContain('<img');
    expect(cuerpo).toEqual(expect.objectContaining({ titulo: 'TEMA CON IMAGEN E2E', descripcion_titulo: `NuxeoEnlace:${ENLACE_SUBIDO}` }));
  });

  // La subida se simuló en la página; el POST del tema lo bloqueó el marco (@lectura): nada se guardó.
  expect(escriturasBloqueadas.filter((e) => /gestor_documental/.test(e))).toEqual([]);
  // El marco registra el bloqueo en su manejador de ruta, un instante después del evento de la petición
  await expect.poll(() => escriturasBloqueadas.some((e) => /\/tema$/.test(e)), { message: 'el POST del tema quedó bloqueado' }).toBe(true);
});
