// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasEspecialesPage } from '../../pages/auditorias-especiales.page';
import { VIGENCIA_CON_AUDITORIAS } from './datos';

test('el auditor experto consulta las auditorías especiales y sus auditorías concretas', { tag: ['@programacion', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const especiales = new AuditoriasEspecialesPage(page);
  await especiales.abrir();

  await test.step(`la vigencia ${VIGENCIA_CON_AUDITORIAS} lista sus auditorías especiales`, async () => {
    await especiales.elegirVigencia(VIGENCIA_CON_AUDITORIAS);
    await expect(especiales.filasPadre.first()).toBeVisible({ timeout: 90_000 });
    await expect(especiales.botonCrear).toBeVisible();
  });

  await test.step('una auditoría padre se expande y muestra sus auditorías concretas sin cronograma', async () => {
    const padres = await especiales.filasPadre.count();
    let conConcretas = false;
    for (let i = 0; i < padres && !conConcretas; i++) {
      const fila = especiales.filasPadre.nth(i);
      await especiales.expandir(fila);
      await especiales.filasConcretas.first().waitFor({ timeout: 10_000 }).catch(() => undefined);
      conConcretas = (await especiales.filasConcretas.count()) > 0;
    }
    expect(conConcretas, `alguna auditoría especial de ${VIGENCIA_CON_AUDITORIAS} tiene auditorías concretas`).toBe(true);
    const indiceCronograma = (await especiales.encabezados.allInnerTexts()).map((t) => t.trim()).indexOf('Cronograma de Actividades');
    for (const cronograma of await especiales.filasConcretas.locator(`td:nth-child(${indiceCronograma + 1})`).allInnerTexts()) {
      expect(cronograma.trim()).toEqual('');
    }
    await testInfo.attach('auditorías concretas', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  expect(escriturasBloqueadas, 'consultar no debe intentar escribir').toEqual([]);
});
