// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { MarcoGeneralPage, SECCIONES_MARCO } from '../../pages/marco-general.page';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { RegistrarAuditoriasPage } from '../../pages/registrar-auditorias.page';
import { ACCIONES_PLAN_APROBADO, COLUMNAS_AUDITORIAS_PLAN, VIGENCIA_APROBADA } from './datos';

test('el auditor experto consulta un PAA aprobado sin poder editarlo', { tag: ['@programacion', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const planes = new PlanAuditoriaPage(page);
  await planes.abrir();

  await test.step(`el menú del PAA ${VIGENCIA_APROBADA} ofrece las consultas`, async () => {
    const acciones = await planes.abrirAcciones(await planes.filaDeVigencia(VIGENCIA_APROBADA));
    expect(acciones).toEqual(expect.arrayContaining(ACCIONES_PLAN_APROBADO));
    await planes.cerrarAcciones();
  });

  const marco = new MarcoGeneralPage(page);
  await test.step('Ver Marco General muestra sus cuatro secciones sin campos editables', async () => {
    await planes.accionDeVigencia(VIGENCIA_APROBADA, 'Ver Marco General');
    await marco.esperarCarga();
    await expect(page).toHaveURL(/\/plan-auditoria\/ver\/[0-9a-f]{24}$/);
    for (const seccion of SECCIONES_MARCO) {
      await expect(marco.seccion(seccion)).toBeVisible();
      expect((await marco.textoSeccion(seccion)).trim(), `la sección ${seccion} tiene texto`).not.toEqual('');
    }
    await expect(marco.camposEditables).toHaveCount(0);
    await testInfo.attach('marco general', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('Regresar vuelve al listado', async () => {
    await marco.regresar();
    await expect(planes.filas.first()).toBeVisible();
  });

  const auditorias = new RegistrarAuditoriasPage(page);
  await test.step('Ver Auditorias muestra las auditorías del PAA sin edición', async () => {
    await planes.accionDeVigencia(VIGENCIA_APROBADA, 'Ver Auditorias');
    await auditorias.esperarCarga();
    expect(await auditorias.nombresEncabezados()).toEqual(COLUMNAS_AUDITORIAS_PLAN);
    await expect(auditorias.botonAnadir).toHaveCount(0);
    await testInfo.attach('auditorías del PAA', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('Exportar tabla descarga el xlsx', async () => {
    const descarga = await auditorias.exportar();
    expect(descarga.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  expect(escriturasBloqueadas, 'consultar no debe intentar escribir').toEqual([]);
});
