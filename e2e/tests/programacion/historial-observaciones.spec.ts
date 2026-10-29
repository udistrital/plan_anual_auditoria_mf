// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { HistorialObservacionesDialog } from '../../pages/dialogos-plan.page';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { VIGENCIA_APROBADA } from './datos';

test('el historial de observaciones del PAA muestra quién, con qué rol y cuándo, de la más reciente a la más antigua', { tag: ['@programacion', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const planes = new PlanAuditoriaPage(page);
  await planes.abrir();

  const historial = new HistorialObservacionesDialog(page);
  await planes.accionDeVigencia(VIGENCIA_APROBADA, 'Historial de Observaciones');
  await historial.esperarCarga();
  await expect(historial.descripcion).toContainText(VIGENCIA_APROBADA);
  const observaciones = await historial.observaciones();

  await test.step('hay observaciones, cada una con revisor, rol y fecha', async () => {
    expect(observaciones.length, `el PAA ${VIGENCIA_APROBADA} debería tener observaciones`).toBeGreaterThan(0);
    for (const o of observaciones) {
      expect(o.revisadoPor).not.toEqual('');
      expect(o.rol).not.toEqual('');
      expect(o.fecha).not.toBeNull();
    }
    await testInfo.attach('historial de observaciones', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('el orden es de la más reciente a la más antigua', async () => {
    const fechas = observaciones.map((o) => o.fecha!.getTime());
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a));
  });

  await test.step('los rechazos se distinguen de las revisiones', async () => {
    expect(observaciones.some((o) => o.rechazo), 'el PAA tiene al menos un rechazo').toBe(true);
  });

  await historial.cerrar();
  expect(escriturasBloqueadas, 'consultar no debe intentar escribir').toEqual([]);
});
