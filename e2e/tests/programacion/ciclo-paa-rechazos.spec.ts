// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { HistorialObservacionesDialog } from '../../pages/dialogos-plan.page';
import { CicloPaa, auditoriaSimple } from './ciclo';
import { PLAN_ESTADO, VIGENCIA_E2E } from './datos';

test('ciclo del PAA con rechazos: el jefe y el secretario lo devuelven con su observación', { tag: ['@programacion', '@auditor-experto', '@escritura'] }, async ({ page, context, request, limpieza, comoRol }, testInfo) => {
  test.setTimeout(25 * 60_000);
  const ciclo = await CicloPaa.iniciar({ page, context, request, limpieza, comoRol }, testInfo);
  const { planes, marca, api } = ciclo;
  const motivoJefe = `${marca} rechazo del jefe: falta el alcance de la auditoría`;
  const motivoSecretario = `${marca} rechazo del secretario: el comité pide otra fecha`;

  /** El auditor experto abre el historial del PAA y devuelve las observaciones (la más reciente primero). */
  const historial = async (captura: string) => {
    await planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Historial de Observaciones');
    const dialogo = new HistorialObservacionesDialog(page);
    await dialogo.esperarCarga();
    const observaciones = await dialogo.observaciones();
    await ciclo.captura(captura);
    await dialogo.cerrar();
    return observaciones;
  };

  await ciclo.crearPaa();
  await ciclo.llenarMarco();
  await test.step('registra una auditoría y guarda el PAA', async () => {
    await ciclo.abrirRegistro();
    await ciclo.registrarAuditoria(auditoriaSimple(marca));
    await ciclo.guardarPaa();
  });
  await ciclo.enviarAJefe(`${marca} primer envío`);

  await test.step('el jefe OCI rechaza el PAA con su observación y vuelve al auditor experto', async () => {
    await ciclo.rechazar('jefe-oci', motivoJefe);
  });

  await test.step('el auditor experto ve el rechazo del jefe en el historial de observaciones', async () => {
    const [ultima] = await historial('historial tras el rechazo del jefe');
    expect(ultima).toMatchObject({ observacion: motivoJefe, rechazo: true });
    expect(ultima.revisadoPor, 'el rechazo dice quién lo hizo').not.toBe('');
  });

  await test.step('el PAA rechazado se puede volver a enviar', async () => {
    const acciones = await planes.abrirAcciones(await planes.filaDeHoy(VIGENCIA_E2E));
    expect(acciones).toEqual(expect.arrayContaining(['Editar Marco General', 'Registrar Auditorías', 'Enviar Aprobación']));
    await planes.cerrarAcciones();
  });
  await ciclo.enviarAJefe(`${marca} reenvío tras el rechazo del jefe`);
  await ciclo.aprobarComoJefe();

  await test.step('el secretario rechaza el PAA con su observación y vuelve al auditor experto', async () => {
    await ciclo.rechazar('secretario', motivoSecretario);
  });

  await test.step('el historial muestra los dos rechazos, el más reciente primero', async () => {
    const observaciones = await historial('historial con los dos rechazos');
    const rechazos = observaciones.filter((o) => o.rechazo).map((o) => o.observacion);
    expect(rechazos).toEqual([motivoSecretario, motivoJefe]);
  });

  await test.step('los rechazos quedan registrados con usuario, rol y observación', async () => {
    const rechazos = (await api.estadosDelPlan(ciclo.planId)).filter((e: any) => e.estado_id === PLAN_ESTADO.RECHAZADO);
    await testInfo.attach('rechazos registrados', {
      body: rechazos.map((e: any) => `usuario_id=${e.usuario_id} usuario_rol=${e.usuario_rol} ${e.observacion}`).join('\n'),
      contentType: 'text/plain',
    });
    expect(rechazos.map((e: any) => e.observacion)).toEqual([motivoJefe, motivoSecretario]);
    for (const e of rechazos) {
      expect(e.usuario_id).toBeTruthy();
      expect(e.usuario_rol).toBeTruthy();
    }
  });

  await ciclo.adjuntarCorreos();
});
