// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { DocumentosDialog } from '../../pages/dialogos-plan.page';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { VIGENCIA_APROBADA } from './datos';

test('el auditor experto revisa los documentos de un PAA aprobado', { tag: ['@programacion', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const planes = new PlanAuditoriaPage(page);
  await planes.abrir();

  const documentos = new DocumentosDialog(page);
  await test.step('Ver Documentos abre el diálogo de la vigencia', async () => {
    await planes.accionDeVigencia(VIGENCIA_APROBADA, 'Ver Documentos');
    await documentos.esperarCarga();
    await expect(documentos.descripcion).toContainText(`Vigencia ${VIGENCIA_APROBADA}`);
  });

  await test.step('tiene el Formato PAA Original y el Actualizado', async () => {
    expect(await documentos.pestanas()).toEqual(expect.arrayContaining(['Formato PAA Original', 'Formato PAA Actualizado']));
  });

  await test.step('al terminar la descarga de los documentos aparece el Acta de Comité', async () => {
    await documentos.esperarPestana('Acta de Comité');
  });

  for (const pestana of ['Formato PAA Original', 'Formato PAA Actualizado', 'Acta de Comité']) {
    await test.step(`${pestana} muestra su documento`, async () => {
      await documentos.elegirPestana(pestana);
      await expect(documentos.visor).toBeVisible({ timeout: 60_000 });
      await testInfo.attach(pestana, { body: await page.screenshot(), contentType: 'image/png' });
    });
  }

  await test.step('Regresar cierra el diálogo', async () => {
    await documentos.cerrar();
  });

  expect(escriturasBloqueadas, 'consultar no debe intentar escribir').toEqual([]);
});
