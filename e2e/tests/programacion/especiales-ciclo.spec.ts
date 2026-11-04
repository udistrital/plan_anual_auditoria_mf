// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { resolverAlertas } from '../../pages/alertas';
import { AsignarAuditorModal } from '../../pages/asignar-auditorias.page';
import { AuditoriasEspecialesPage } from '../../pages/auditorias-especiales.page';
import { AuditoriaModal } from '../../pages/registrar-auditorias.page';
import { auditoriaSimple } from './ciclo';
import { VIGENCIA_E2E } from './datos';
import { ApiProgramacion, interceptarCorreos, marcadorE2E, tokenDe } from './limpieza';

test('auditorías especiales: crear la auditoría padre, generar sus concretas hasta el máximo y eliminar una', { tag: ['@programacion', '@auditor-experto', '@escritura'] }, async ({ page, context, request, limpieza }, testInfo) => {
  test.setTimeout(15 * 60_000);
  const marca = marcadorE2E();
  const api = new ApiProgramacion(request, () => tokenDe(page));
  await interceptarCorreos(context, testInfo);
  const especiales = new AuditoriasEspecialesPage(page);
  const datos = { ...auditoriaSimple(marca), nombre: `${marca} auditoría especial` };
  await especiales.abrir();

  await test.step(`la vigencia ${VIGENCIA_E2E} queda sin auditorías especiales de E2E`, async () => {
    const borradas = await api.liberarEspeciales(VIGENCIA_E2E);
    await testInfo.attach('especiales de corridas anteriores borradas', { body: String(borradas), contentType: 'text/plain' });
  });

  let padreId = '';
  await test.step('crea una auditoría especial', async () => {
    await especiales.elegirVigencia(VIGENCIA_E2E);
    padreId = await especiales.crear();
    const id = padreId;
    limpieza.registrar(`borrar la auditoría especial de la prueba (${id}) y sus concretas`, () => api.borrarEspecial(id));
    expect((await resolverAlertas(page)).join(' ')).toContain('Auditoría especial creada exitosamente');
    await expect(especiales.filaPadre('Sin Titulo')).toBeVisible({ timeout: 90_000 });
  });

  await test.step('al editarla con cantidad 1 se genera su auditoría concreta y se abre la asignación de auditores', async () => {
    await especiales.accion(especiales.filaPadre('Sin Titulo'), 'Editar Auditoría Especial');
    const modal = new AuditoriaModal(page);
    await expect(modal.dialogo).toBeVisible();
    await modal.llenar(datos);
    await modal.botonGuardar.click();
    await resolverAlertas(page);
    const asignacion = new AsignarAuditorModal(page);
    await asignacion.esperarCarga();
    await expect(asignacion.nombre).toHaveValue(datos.nombre);
    await testInfo.attach('asignación de la concreta generada', { body: await page.screenshot(), contentType: 'image/png' });
    await asignacion.cerrar();
    expect(await api.concretasDe(padreId)).toHaveLength(1);
  });

  const fila = especiales.filaPadre(datos.nombre);
  await test.step('la auditoría padre se expande y muestra su concreta', async () => {
    await expect(fila).toBeVisible({ timeout: 90_000 });
    await especiales.expandir(fila);
    await expect(especiales.concretasVisibles).toHaveCount(1, { timeout: 60_000 });
    await testInfo.attach('concreta generada', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('la auditoría concreta se elimina', async () => {
    await especiales.accion(especiales.concretasVisibles.first(), 'Eliminar Auditoría Concreta');
    expect((await resolverAlertas(page)).join(' ')).toContain('Auditoría eliminada exitosamente');
    await expect.poll(() => api.concretasDe(padreId).then((c) => c.length), { timeout: 60_000 }).toBe(0);
  });

  await test.step('"Generar una Auditoría" crea la concreta de nuevo', async () => {
    await especiales.accion(especiales.filaPadre(datos.nombre), 'Generar una Auditoría');
    expect((await resolverAlertas(page)).join(' ')).toContain('Auditoría generada exitosamente');
    await expect.poll(() => api.concretasDe(padreId).then((c) => c.length), { timeout: 60_000 }).toBe(1);
  });

  await test.step('al llegar a la cantidad registrada no deja generar más', async () => {
    await especiales.accion(especiales.filaPadre(datos.nombre), 'Generar una Auditoría');
    expect((await resolverAlertas(page)).join(' ')).toContain('Ya tiene el número máximo de auditorías');
    await testInfo.attach('máximo de auditorías', { body: await page.screenshot(), contentType: 'image/png' });
    expect(await api.concretasDe(padreId)).toHaveLength(1);
  });
});
