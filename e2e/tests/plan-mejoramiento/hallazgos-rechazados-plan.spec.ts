// spec: e2e/specs/hallazgos-rechazados-plan.plan.md
import { test, expect } from '../../core/fixtures';
import { HallazgosPlanPage } from '../../pages/hallazgos-plan.page';

/**
 * Auditorías de pruebas con hallazgos rechazados en el preinforme y plan de mejoramiento. Por defecto, la única de
 * la vigencia 2026 (en pruebas): 3 hallazgos activos, 1 rechazado por el auditor experto. Se pueden fijar con
 * E2E_AUDITORIAS_CON_RECHAZADOS (ids separados por coma).
 */
const AUDITORIAS = (process.env['E2E_AUDITORIAS_CON_RECHAZADOS'] || '6ae335fbb80ffc751c08bb72')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

for (const auditoriaId of AUDITORIAS) {
  test(`Registrar plan no muestra ni cuenta los hallazgos rechazados en el preinforme (auditoría …${auditoriaId.slice(-6)})`, { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura'] }, async ({ page, request, escriturasBloqueadas }, testInfo) => {
    const registrar = new HallazgosPlanPage(page);
    const respuestas = await registrar.abrir(auditoriaId);

    // Lo que hay en la base para el informe de esta auditoría, consultado igual que lo hace la pantalla
    const primera = new URL(respuestas[0].url());
    const informeId = primera.searchParams.get('query')!.match(/informe_id:([0-9a-f]{24})/)![1];
    const base = primera.href.slice(0, primera.href.indexOf('hallazgo?'));
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const r = await request.get(`${base}hallazgo?query=informe_id:${informeId},activo:true&limit=0`, { headers: { Authorization: `Bearer ${token}` } });
    expect(r.ok(), 'el CRUD responde la consulta de comprobación').toBeTruthy();
    const todos: { rechazado?: boolean }[] = (await r.json()).Data ?? [];
    const rechazados = todos.filter((h) => h.rechazado === true).length;
    const esperados = todos.length - rechazados;
    expect(rechazados, 'la auditoría de prueba debe tener al menos un hallazgo rechazado (dato semilla)').toBeGreaterThan(0);

    await test.step('la pantalla pide los hallazgos sin los rechazados', async () => {
      for (const respuesta of respuestas) {
        // soft: si falla, los pasos siguientes igual muestran cuántas filas y qué total salen de más
        expect.soft(decodeURIComponent(respuesta.url()), 'filtro de la consulta de hallazgos').toContain('rechazado__not:true');
      }
    });

    await test.step(`la tabla muestra solo los ${esperados} hallazgos no rechazados (${todos.length} activos, ${rechazados} rechazados)`, async () => {
      await expect.soft(registrar.filasHallazgo).toHaveCount(esperados);
    });

    await test.step('el resumen de cumplimiento cuenta solo los no rechazados', async () => {
      expect.soft(await registrar.totalEnResumen()).toBe(esperados);
      await testInfo.attach('registrar plan sin hallazgos rechazados', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    });

    expect(escriturasBloqueadas).toEqual([]);
  });
}
