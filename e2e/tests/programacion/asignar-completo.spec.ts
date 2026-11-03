// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { resolverAlertas } from '../../pages/alertas';
import { AsignarAuditoriasPage } from '../../pages/asignar-auditorias.page';
import { CicloPaa, auditoriaSimple } from './ciclo';
import { AUDITORIA_ESTADO_PROGRAMACION, VIGENCIA_E2E } from './datos';

test('asignar auditores: asignar, desasignar, reasignar y lista de desasignados', { tag: ['@programacion', '@auditor-experto', '@escritura'] }, async ({ page, context, request, limpieza, comoRol }, testInfo) => {
  test.setTimeout(25 * 60_000);
  const ciclo = await CicloPaa.iniciar({ page, context, request, limpieza, comoRol }, testInfo);
  const { api, marca } = ciclo;
  const auditoria = auditoriaSimple(marca);

  // Asignar solo muestra las auditorías de un PAA aprobado: se arma con la aplicación (D35).
  await ciclo.prepararPaaAprobado(auditoria);
  const [hija] = await api.auditoriasDelPlan(ciclo.planId);
  expect(hija, 'el PAA aprobado generó la auditoría').toBeTruthy();
  /** Cuántos registros de auditor de la auditoría están asignados y cuántos desasignados. */
  const asignacion = async () => {
    const registros = await api.auditoresDe(hija._id);
    return { asignados: registros.filter((a: any) => a.asignado).length, desasignados: registros.filter((a: any) => a.asignado === false).length };
  };

  const asignar = new AsignarAuditoriasPage(page);
  const abrirModal = async () => {
    await asignar.abrir();
    await asignar.elegirVigencia(VIGENCIA_E2E);
    const fila = asignar.filaAuditoria(auditoria.nombre);
    await expect(fila).toBeVisible({ timeout: 120_000 });
    return { fila, modal: await asignar.abrirAsignacion(fila) };
  };

  let lider = '';
  let apoyo = '';
  await test.step('asigna dos auditores, uno como líder, y la auditoría pasa a "auditor asignado"', async () => {
    const { modal } = await abrirModal();
    await expect(modal.filasAuditor).toHaveCount(0);
    await modal.botonAgregarAuditor.click();
    [lider] = await modal.auditoresDisponibles(0);
    await modal.elegirAuditor(0, lider);
    await modal.checkLider(0).check();
    await modal.botonAgregarAuditor.click();
    [apoyo] = await modal.auditoresDisponibles(1);
    await modal.elegirAuditor(1, apoyo);
    await ciclo.captura('dos auditores elegidos');
    await modal.botonGuardar.click();
    await resolverAlertas(page);
    await expect(modal.dialogo).toBeHidden();
    await expect.poll(asignacion, { timeout: 60_000 }).toEqual({ asignados: 2, desasignados: 0 });
    expect(await api.estadoActualAuditoria(hija._id)).toBe(AUDITORIA_ESTADO_PROGRAMACION.AUDITOR_ASIGNADO);
  });

  const { fila, modal } = await abrirModal();
  await test.step('al volver a abrir, el modal muestra a los dos asignados y al líder', async () => {
    await expect(fila).toContainText(new RegExp(lider.split(' ')[0], 'i'));
    await expect(modal.filasAuditor).toHaveCount(2);
    expect((await modal.auditoresAsignados()).sort()).toEqual([lider, apoyo].sort());
    await expect(modal.filaDe(lider).getByRole('checkbox', { name: 'Auditor Lider' })).toBeChecked();
    await expect(modal.filaDe(apoyo).getByRole('checkbox', { name: 'Auditor Lider' })).not.toBeChecked();
    await expect(modal.desasignados).toHaveCount(0);
  });

  await test.step('desasignar un auditor lo pasa a la lista de desasignados y deja de ofrecerse', async () => {
    await modal.desasignar(apoyo);
    expect((await resolverAlertas(page)).join(' ')).toContain('Auditor desasignado correctamente');
    await expect(modal.filasAuditor).toHaveCount(1);
    expect(await modal.nombresDesasignados()).toEqual([apoyo]);
    await modal.botonAgregarAuditor.click();
    expect(await modal.auditoresDisponibles(1), 'un desasignado no se ofrece en los selectores').not.toContain(apoyo);
    await ciclo.captura('auditor desasignado');
    await expect.poll(asignacion, { timeout: 60_000 }).toEqual({ asignados: 1, desasignados: 1 });
  });

  await test.step('no deja desasignar al único auditor asignado', async () => {
    await modal.desasignar(lider);
    await expect(modal.alerta).toContainText('Debe haber al menos un auditor asignado');
    await modal.confirmarAlerta();
    await expect(modal.filasAuditor.filter({ hasText: lider })).toHaveCount(1);
  });

  await test.step('reasignar devuelve al auditor a los asignados', async () => {
    await modal.reasignar(apoyo);
    expect((await resolverAlertas(page)).join(' ')).toContain('Auditor asignado correctamente');
    await expect(modal.desasignados).toHaveCount(0);
    await expect(modal.filasAuditor.filter({ hasText: apoyo })).toHaveCount(1);
    await expect.poll(asignacion, { timeout: 60_000 }).toEqual({ asignados: 2, desasignados: 0 });
    await ciclo.captura('auditor reasignado');
    await modal.cerrar();
  });

  await test.step('la tabla de Asignar muestra a los dos auditores', async () => {
    await asignar.abrir();
    await asignar.elegirVigencia(VIGENCIA_E2E);
    const filaFinal = asignar.filaAuditoria(auditoria.nombre);
    await expect(filaFinal).toContainText(new RegExp(apoyo.split(' ')[0], 'i'), { timeout: 120_000 });
    await expect(filaFinal).toContainText(new RegExp(lider.split(' ')[0], 'i'));
    await ciclo.captura('tabla de asignación');
  });

  await ciclo.adjuntarCorreos();
});
