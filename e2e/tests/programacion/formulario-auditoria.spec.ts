// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { RegistrarAuditoriasPage } from '../../pages/registrar-auditorias.page';
import { PLAN_ESTADO, VIGENCIA_APROBADA, simularPlanEnEstado } from './datos';

test('el formulario de auditoría valida los campos y no crea nada al cerrar', { tag: ['@programacion', '@auditor-experto', '@lectura', '@simulado'] }, async ({ page, escriturasBloqueadas, simularGet }, testInfo) => {
  await simularPlanEnEstado(simularGet, VIGENCIA_APROBADA, PLAN_ESTADO.EN_BORRADOR_ID);
  const planes = new PlanAuditoriaPage(page);
  await planes.abrir();

  await test.step('un PAA en Borrador ofrece editarlo, registrar auditorías y enviarlo', async () => {
    const acciones = await planes.abrirAcciones(await planes.filaDeVigencia(VIGENCIA_APROBADA));
    expect(acciones).toEqual(['Editar Marco General', 'Registrar Auditorías', 'Enviar Aprobación']);
    await planes.elegirAccion('Registrar Auditorías');
  });

  const registro = new RegistrarAuditoriasPage(page);
  await registro.esperarCarga();
  const filasAntes = await registro.filas.count();
  let modal = await registro.abrirNuevaAuditoria();

  await test.step('guardar vacío marca los campos obligatorios y no cierra el modal', async () => {
    await modal.botonGuardar.click();
    await expect(modal.errores.first()).toBeVisible();
    expect((await modal.textosError()).length).toBeGreaterThanOrEqual(5);
    await expect(modal.dialogo).toBeVisible();
    await testInfo.attach('campos obligatorios', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('los procesos dependen de los macroprocesos elegidos', async () => {
    expect(await modal.opciones('procesos'), 'sin macroprocesos, Procesos no ofrece opciones').toEqual([]);
    const [macroproceso] = await modal.opciones('macroprocesos');
    await modal.elegir('macroprocesos', macroproceso);
    expect((await modal.opciones('procesos')).length, `procesos de ${macroproceso}`).toBeGreaterThan(0);
  });

  await test.step('el cronograma admite varios meses o "Todos", que es excluyente', async () => {
    const [todos, mes1, mes2] = await modal.opciones('cronograma');
    expect(todos).toEqual('Todos');
    await modal.elegir('cronograma', mes1, mes2);
    expect(await modal.seleccionadas('cronograma')).toEqual([mes1, mes2]);
    await modal.elegir('cronograma', 'Todos');
    expect(await modal.seleccionadas('cronograma'), '"Todos" reemplaza a los meses elegidos').toEqual(['Todos']);
  });

  await test.step('cerrar sin guardar no crea la auditoría y el formulario vuelve vacío', async () => {
    await modal.nombre.fill('E2E — no se guarda');
    await modal.cerrar();
    await expect(registro.filas).toHaveCount(filasAntes);
    modal = await registro.abrirNuevaAuditoria();
    await expect(modal.nombre).toHaveValue('');
    await modal.cerrar();
  });

  expect(escriturasBloqueadas, 'validar el formulario no debe intentar escribir').toEqual([]);
});
