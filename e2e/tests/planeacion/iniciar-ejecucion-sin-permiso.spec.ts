// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasInternasPage } from '../../pages/auditorias-internas.page';
import { SEMILLA_RESUMEN_HALLAZGOS as SEMILLA, VIGENCIA_SEMILLA } from '../ejecucion/datos';

test('el auditor no ve Iniciar Ejecución en una auditoría que ya está en Ejecución', { tag: ['@planeacion', '@auditor', '@lectura'] }, async ({ page, escriturasBloqueadas }) => {
  const planeacion = new AuditoriasInternasPage(page, 'planeacion');

  await test.step(`la auditoría semilla "${SEMILLA.titulo}", con el preinforme en revisión, no ofrece Iniciar Ejecución`, async () => {
    await planeacion.abrir();
    await planeacion.elegirVigencia(VIGENCIA_SEMILLA);
    const fila = planeacion.filaAuditoria(SEMILLA.titulo);
    await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
    const botonAcciones = fila.locator('td:last-child button');
    // Sin acciones para el estado, la fila no tiene menú; si lo tiene, no debe incluir Iniciar Ejecución.
    if (await botonAcciones.count()) expect(await planeacion.abrirAcciones(fila)).not.toContain('Iniciar Ejecución');
  });

  expect(escriturasBloqueadas).toEqual([]);
});
