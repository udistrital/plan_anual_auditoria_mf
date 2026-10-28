// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { COLUMNAS_PLANES } from './datos';

test('el auditor experto consulta el listado de planes anuales', { tag: ['@programacion', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const planes = new PlanAuditoriaPage(page);
  await planes.abrir();

  await test.step('la tabla tiene sus columnas', async () => {
    expect((await planes.encabezados.allInnerTexts()).map((t) => t.trim())).toEqual(COLUMNAS_PLANES);
  });

  await test.step('las fechas van en dd/mm/aaaa y cada estado lleva su color', async () => {
    for (const fecha of await planes.columna('Fecha Creación')) expect(fecha).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    for (const estado of await planes.columna('Estado')) expect(estado).toMatch(/^(⚪|🔵|🟢|🔴|🟡|🟠)\s+\S/u);
    await testInfo.attach('listado de planes', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('por defecto se ven 5 planes y con 10 por página se ven 10', async () => {
    await expect(planes.filas).toHaveCount(Math.min(5, await planes.total()));
    await planes.cambiarTamanoPagina(10);
  });

  await test.step('la página siguiente muestra otros planes', async () => {
    const primera = await planes.columna('Vigencia');
    await page.getByRole('button', { name: /Siguiente página|Next page/ }).click();
    await expect.poll(() => planes.columna('Vigencia')).not.toEqual(primera);
  });

  await test.step('el auditor experto puede crear un PAA', async () => {
    await expect(planes.selectorVigencia).toBeVisible();
    await expect(planes.botonCrear).toBeVisible();
  });

  expect(escriturasBloqueadas, 'consultar no debe intentar escribir').toEqual([]);
});
