// spec: e2e/specs/registro-avances.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

test('el auditado ve el aviso cuando la acción no tiene calificaciones', { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura', '@simulado'] }, async ({ page, simularGet }, testInfo) => {
  // Estado preparado sin escribir en el backend: calificacion-accion responde vacío.
  await simularGet('**/calificacion-accion?query=*', () => []);

  const registro = await abrirAccion(page, 'registrar-avances');

  await expect(registro.sinCalificacion).toBeVisible();
  await expect(registro.calificacionVigente).toHaveCount(0);
  await expect(registro.botonHistorial).toHaveCount(0);
  await testInfo.attach('sin calificaciones', { body: await page.screenshot(), contentType: 'image/png' });
});
