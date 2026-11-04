// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { RevisionPlanPage } from '../../pages/revision-plan.page';
import { PLAN_ESTADO, VIGENCIA_APROBADA, simularPlanEnEstado } from './datos';

test('el jefe OCI revisa un PAA enviado a su aprobación', { tag: ['@programacion', '@jefe-oci', '@lectura', '@simulado'] }, async ({ page, escriturasBloqueadas, simularGet }, testInfo) => {
  await simularPlanEnEstado(simularGet, VIGENCIA_APROBADA, PLAN_ESTADO.EN_REVISION_JEFE_ID);
  const planes = new PlanAuditoriaPage(page);
  await planes.abrir();

  await test.step('el jefe no crea planes', async () => {
    await expect(planes.botonCrear).toHaveCount(0);
  });

  await test.step('un PAA en revisión del jefe ofrece Ver Plan', async () => {
    const acciones = await planes.abrirAcciones(await planes.filaDeVigencia(VIGENCIA_APROBADA));
    expect(acciones).toContain('Ver Plan');
    await planes.elegirAccion('Ver Plan');
  });

  const revision = new RevisionPlanPage(page, 'jefe');
  await test.step('Ver Plan muestra el Formato PAA Original y las decisiones del jefe', async () => {
    await revision.esperarCarga();
    await expect(revision.pestanaOriginal).toBeVisible();
    await expect(revision.botonRechazar).toBeVisible();
    await expect(revision.botonAprobar).toBeVisible();
    await testInfo.attach('revisión del jefe', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('rechazar pide los motivos y se puede regresar sin rechazar', async () => {
    const rechazo = await revision.abrirRechazo();
    await expect(rechazo.motivos).toBeVisible();
    await expect(rechazo.botonRechazar).toBeVisible();
    await testInfo.attach('motivos del rechazo', { body: await page.screenshot(), contentType: 'image/png' });
    await rechazo.cerrar();
  });

  expect(escriturasBloqueadas, 'revisar no debe intentar escribir').toEqual([]);
});
