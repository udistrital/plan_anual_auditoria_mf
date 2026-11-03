// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { AsignarAuditoriasPage } from '../../pages/asignar-auditorias.page';
import { VIGENCIA_CON_AUDITORIAS } from './datos';

// No depende de los auditores ya asignados: el modal descarta a los que no siguen activos en rol/periods
// ("Auditor con ID … no encontrado en la lista de auditores", hallazgo reportado en sisifo_documentacion#939).
test('el modal de asignación no repite auditores y admite un solo líder', { tag: ['@programacion', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const asignar = new AsignarAuditoriasPage(page);
  await asignar.abrir();
  await asignar.elegirVigencia(VIGENCIA_CON_AUDITORIAS);
  await expect(asignar.filas.first(), `la vigencia ${VIGENCIA_CON_AUDITORIAS} debería tener auditorías`).toBeVisible({ timeout: 120_000 });

  const modal = await asignar.abrirAsignacion(asignar.filas.first());
  const filasIniciales = await modal.filasAuditor.count();

  await test.step('el modal trae los datos de la auditoría y el tipo no es editable', async () => {
    await expect(modal.nombre).not.toHaveValue('');
    await expect(modal.tipoEvaluacion).not.toBeEditable();
  });

  let elegido = '';
  await test.step('se agrega un auditor desde la lista de auditores disponibles', async () => {
    await modal.botonAgregarAuditor.click();
    await expect(modal.filasAuditor).toHaveCount(filasIniciales + 1);
    const disponibles = await modal.auditoresDisponibles(filasIniciales);
    expect(disponibles.length, 'hay auditores disponibles').toBeGreaterThan(1);
    elegido = disponibles[0];
    await modal.elegirAuditor(filasIniciales, elegido);
  });

  await test.step('el auditor elegido no aparece en la fila siguiente', async () => {
    await modal.botonAgregarAuditor.click();
    await expect(modal.filasAuditor).toHaveCount(filasIniciales + 2);
    expect(await modal.auditoresDisponibles(filasIniciales + 1)).not.toContain(elegido);
    await modal.elegirAuditor(filasIniciales + 1, (await modal.auditoresDisponibles(filasIniciales + 1))[0]);
  });

  await test.step('solo un auditor queda como líder', async () => {
    await modal.checkLider(filasIniciales).check();
    await modal.checkLider(filasIniciales + 1).check();
    let lideres = 0;
    for (let i = 0; i < (await modal.filasAuditor.count()); i++) if (await modal.checkLider(i).isChecked()) lideres++;
    expect(lideres).toBe(1);
    await testInfo.attach('modal de asignación', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('cerrar no guarda', async () => {
    await modal.cerrar();
  });

  expect(escriturasBloqueadas, 'abrir y cerrar el modal no debe intentar escribir').toEqual([]);
});
