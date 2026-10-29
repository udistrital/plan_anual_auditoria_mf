// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { RevisionPlanPage } from '../../pages/revision-plan.page';
import { PLAN_ESTADO, VIGENCIA_APROBADA, simularPlanEnEstado } from './datos';

test('el secretario revisa un PAA y la aprobación le pide el Acta de CCCI', { tag: ['@programacion', '@secretario', '@lectura', '@simulado'] }, async ({ page, escriturasBloqueadas, simularGet }, testInfo) => {
  await simularPlanEnEstado(simularGet, VIGENCIA_APROBADA, PLAN_ESTADO.EN_REVISION_SECRETARIO_ID);
  const planes = new PlanAuditoriaPage(page);
  await planes.abrir();

  await test.step('el secretario no crea planes', async () => {
    await expect(planes.botonCrear).toHaveCount(0);
  });

  await test.step('un PAA en revisión del comité ofrece Ver Plan', async () => {
    const acciones = await planes.abrirAcciones(await planes.filaDeVigencia(VIGENCIA_APROBADA));
    expect(acciones).toContain('Ver Plan');
    await planes.elegirAccion('Ver Plan');
  });

  const revision = new RevisionPlanPage(page, 'secretario');
  await test.step('Ver Plan muestra el Formato PAA Original y las decisiones del secretario', async () => {
    await revision.esperarCarga();
    await expect(revision.botonRechazar).toBeVisible();
    await expect(revision.botonAprobar).toBeVisible();
    await testInfo.attach('revisión del secretario', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('aprobar pide el Acta de CCCI y se puede cerrar sin aprobar', async () => {
    const acta = await revision.abrirAprobacionSecretario();
    await expect(acta.archivo).toBeAttached();
    await expect(acta.botonAprobar).toBeVisible();
    await testInfo.attach('acta de CCCI', { body: await page.screenshot(), contentType: 'image/png' });
    await acta.cerrar();
  });

  await test.step('rechazar pide los motivos y se puede regresar sin rechazar', async () => {
    const rechazo = await revision.abrirRechazo();
    await expect(rechazo.motivos).toBeVisible();
    await rechazo.cerrar();
  });

  expect(escriturasBloqueadas, 'revisar no debe intentar escribir').toEqual([]);
});
