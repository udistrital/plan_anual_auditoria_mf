// spec: e2e/specs/programacion.plan.md
import path from 'node:path';
import { test, expect } from '../../core/fixtures';
import { resolverAlertas } from '../../pages/alertas';
import { AsignarAuditoriasPage } from '../../pages/asignar-auditorias.page';
import { DocumentosDialog } from '../../pages/dialogos-plan.page';
import { SECCIONES_MARCO } from '../../pages/marco-general.page';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { RegistrarAuditoriasPage, type DatosAuditoria } from '../../pages/registrar-auditorias.page';
import { CicloPaa, FIXTURES } from './ciclo';
import { AUDITORIA_ESTADO_PROGRAMACION, PLAN_ESTADO, TIPO_DOCUMENTO, VIGENCIA_APROBADA, VIGENCIA_E2E } from './datos';

/** Orden de "Nombre de auditoría A-Z" en el MID (auditoria-ordenamiento.utils: minúsculas y comparación de cadenas). */
const ordenAZ = (titulos: string[]) => [...titulos].sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0));

test('ciclo completo del PAA: el auditor experto lo arma, el jefe lo aprueba con firma y el secretario con el acta', { tag: ['@programacion', '@auditor-experto', '@escritura'] }, async ({ page, context, request, limpieza, comoRol }, testInfo) => {
  test.setTimeout(30 * 60_000);
  const ciclo = await CicloPaa.iniciar({ page, context, request, limpieza, comoRol }, testInfo);
  const { planes, registro, marca, api } = ciclo;

  await test.step(`no se puede crear un PAA en una vigencia que ya tiene (${VIGENCIA_APROBADA})`, async () => {
    await planes.elegirVigenciaNueva(VIGENCIA_APROBADA);
    await planes.botonCrear.click();
    await expect(planes.alerta).toBeVisible({ timeout: 60_000 });
    expect(await planes.textoAlerta()).toMatch(/error|existe/i);
    await ciclo.captura('vigencia repetida');
    await planes.confirmarAlerta();
  });

  await ciclo.crearPaa();

  await test.step('el marco general de un PAA nuevo trae los textos por defecto', async () => {
    const marco = await ciclo.abrirMarco();
    for (const seccion of SECCIONES_MARCO) {
      await expect(marco.campo(seccion), `${seccion} tiene texto por defecto`).not.toHaveValue('');
    }
    await expect(marco.campo('Criterios')).toHaveValue(/Normatividad interna y externa/);
    await ciclo.captura('marco general por defecto', page, true);
  });

  await test.step('el marco general no se guarda con un campo vacío', async () => {
    const marco = await ciclo.abrirMarco();
    const guardados: string[] = [];
    const contar = (r: { method: () => string; url: () => string }) => {
      if (r.method() === 'PUT' && /\/plan-auditoria\/[0-9a-f]{24}$/.test(r.url())) guardados.push(r.url());
    };
    page.on('request', contar);
    await marco.campo('Objetivo').fill('');
    await marco.botonGuardar.click();
    await expect(marco.alerta).toContainText('¿Está seguro(a) de guardar la información?');
    await marco.confirmarAlerta();
    await expect(marco.alerta).toContainText('Información no guardada');
    await expect(page.getByText('Objetivo es requerido')).toBeVisible();
    await ciclo.captura('marco con un campo vacío');
    await marco.confirmarAlerta();
    page.off('request', contar);
    expect(guardados, 'con un campo vacío no se envía el marco').toEqual([]);
  });

  // Se reabre el marco: el componente se suscribe al envío en cada clic de Guardar (después de un intento
  // fallido, el siguiente Guardar enviaría el marco dos veces; hallazgo reportado en la issue).
  await ciclo.llenarMarco();

  // Informe de Ley con dos meses: el MID pone a cada auditoría generada el mes que le corresponde (D36).
  const manual: DatosAuditoria = {
    nombre: `${marca} auditoría manual`,
    tipoEvaluacion: 'Informe de Ley',
    macroprocesos: ['Gestión Académica'],
    procesos: ['Gestión de Docencia'],
    dependencias: ['INGENIERIA TOPOGRAFICA'],
    cronograma: ['Marzo', 'Junio'],
    cantidad: 2,
  };
  await test.step('registra una auditoría llenando todos los campos', async () => {
    await ciclo.abrirRegistro();
    await ciclo.registrarAuditoria(manual);
  });

  await test.step('al editar, quitar un macroproceso quita sus procesos, y cerrar sin guardar no cambia la auditoría', async () => {
    const modal = await registro.editarAuditoria(manual.nombre);
    await modal.elegir('macroprocesos', 'Apoyo a lo Misional');
    await modal.elegir('procesos', 'Gestión de la Información Bibliográfica');
    expect(await modal.seleccionadas('procesos')).toEqual(expect.arrayContaining(['Gestión de Docencia', 'Gestión de la Información Bibliográfica']));
    await modal.elegir('macroprocesos', 'Apoyo a lo Misional');
    await expect.poll(() => modal.seleccionadas('procesos'), { message: 'se quitan los procesos del macroproceso quitado' }).toEqual(['Gestión de Docencia']);
    await ciclo.captura('procesos tras quitar el macroproceso');
    await modal.cerrar();
    await expect(registro.filaAuditoria(manual.nombre)).not.toContainText('Apoyo a lo Misional');
  });

  await test.step('carga dos auditorías más con el cargue masivo', async () => {
    const cargue = await registro.cargueMasivo(path.join(FIXTURES, 'cargue-masivo-e2e.xlsx'));
    await testInfo.attach('cargue masivo en el MID', { body: `${cargue.status} en ${cargue.segundos} s`, contentType: 'text/plain' });
    expect(cargue.status, 'el MID procesa el cargue masivo').toBeLessThan(300);
    await resolverAlertas(page);
    await expect(registro.filaAuditoria('E2E cargue 1')).toBeVisible({ timeout: 60_000 });
    await expect(registro.filaAuditoria('E2E cargue 2')).toBeVisible();
    await expect(registro.filaAuditoria('E2E cargue 2')).toContainText('Gestión de la Información Bibliográfica');
  });

  // "Eliminar Auditoría" no se automatiza: en pruebas el CRUD no recibe el cuerpo del DELETE y responde
  // 400 (D37 de la especificación, hallazgo en la issue). Vuelve cuando se corrija.

  let ordenGuardado: string[] = [];
  await test.step('se ordenan por nombre y Guardar conserva el orden', async () => {
    const antes = await registro.titulos();
    ordenGuardado = ordenAZ(antes);
    expect(antes, 'el orden de registro no es ya alfabético (si no, la prueba no demuestra nada)').not.toEqual(ordenGuardado);
    await registro.ordenarPor('Nombre de auditoría A-Z');
    await expect.poll(() => registro.titulos()).toEqual(ordenGuardado);
    const visor = await registro.verPdf();
    await ciclo.captura('Formato PAA');
    await page.keyboard.press('Escape');
    await expect(visor).toBeHidden();
    await ciclo.guardarPaa();
    await ciclo.abrirRegistro();
    await expect.poll(() => registro.titulos(), { message: 'al volver, las auditorías siguen en el orden guardado' }).toEqual(ordenGuardado);
  });

  await ciclo.enviarAJefe(`${marca} envío de prueba automatizada`);

  await test.step('el jefe OCI edita una auditoría en su revisión ("Editar Auditorías") y guarda el PAA', async () => {
    const jefe = await ciclo.como('jefe-oci');
    await new PlanAuditoriaPage(jefe).accionDePlanDeHoy(VIGENCIA_E2E, 'Editar Auditorías');
    const registroJefe = new RegistrarAuditoriasPage(jefe);
    await expect(registroJefe.filaAuditoria('E2E cargue 1')).toBeVisible({ timeout: 60_000 });
    const modal = await registroJefe.editarAuditoria('E2E cargue 1');
    await modal.elegir('cronograma', 'Abril');
    await modal.botonGuardar.click();
    await resolverAlertas(jefe);
    await expect(registroJefe.filaAuditoria('E2E cargue 1')).toContainText('Abril', { timeout: 60_000 });
    await ciclo.captura('auditoría editada por el jefe', jefe, true);
    await ciclo.guardarPaa({ registro: registroJefe, nombre: 'subida del Formato PAA guardado por el jefe' });
  });

  await test.step('el jefe OCI descarga todos los documentos del PAA', async () => {
    const revision = await ciclo.abrirRevision('jefe-oci');
    const descarga = revision.page.waitForEvent('download', { timeout: 90_000 });
    await revision.botonDescargarTodo.click();
    expect((await descarga).suggestedFilename()).toBe(`documentosPAA-${VIGENCIA_E2E}.zip`);
    await ciclo.aprobarComoJefe(revision);
  });

  await ciclo.aprobarComoSecretario();

  const generadas = await api.auditoriasDelPlan(ciclo.planId);
  await test.step('se generó una auditoría por cada cantidad registrada, y las del Informe llevan su mes', async () => {
    // manual (2) + "E2E cargue 1" (1) + "E2E cargue 2" (2)
    expect(generadas.length).toBe(5);
    const meses = generadas.map((a: any) => String(a.subtitulo ?? '').toUpperCase()).filter(Boolean).sort();
    expect(meses, 'subtítulos de las auditorías generadas del Informe de Ley').toEqual(['JUNIO', 'MARZO']);
  });

  await test.step('Ver Documentos del PAA aprobado incluye el Acta de Comité', async () => {
    const actas = (await api.documentosDelPlan(ciclo.planId)).filter((d: any) => d.tipo_id === TIPO_DOCUMENTO.ACTA_COMITE_COORDINADOR);
    expect(actas, 'el acta del secretario quedó registrada para el plan').toHaveLength(1);
    await planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Ver Documentos');
    const documentos = new DocumentosDialog(page);
    await documentos.esperarCarga();
    await documentos.esperarPestana('Acta de Comité');
    await documentos.elegirPestana('Acta de Comité');
    await expect(documentos.visor).toBeVisible({ timeout: 60_000 });
    await ciclo.captura('Acta de Comité');
    await documentos.cerrar();
  });

  await test.step('el auditor experto asigna un auditor a una auditoría generada', async () => {
    const hija = generadas.find((a: any) => String(a.subtitulo ?? '').toUpperCase() === 'MARZO');
    const asignar = new AsignarAuditoriasPage(page);
    await asignar.abrir();
    await asignar.elegirVigencia(VIGENCIA_E2E);
    const fila = asignar.filaAuditoria(new RegExp(`${manual.nombre}.*MARZO`, 'i'));
    await expect(fila, 'la auditoría generada aparece como "título – subtítulo"').toBeVisible({ timeout: 120_000 });
    const modal = await asignar.abrirAsignacion(fila);
    await modal.botonAgregarAuditor.click();
    const auditor = (await modal.auditoresDisponibles(0))[0];
    await modal.elegirAuditor(0, auditor);
    await modal.checkLider(0).check();
    await ciclo.captura('auditor elegido');
    await modal.botonGuardar.click();
    await resolverAlertas(page);
    await expect.poll(async () => (await api.auditoresDe(hija._id)).filter((a: any) => a.asignado).length, { timeout: 60_000 }).toBe(1);
    expect(await api.estadoActualAuditoria(hija._id)).toBe(AUDITORIA_ESTADO_PROGRAMACION.AUDITOR_ASIGNADO);
  });

  await test.step('edición extraordinaria: cambia una auditoría del PAA aprobado, exige el acta de modificación y genera el Formato PAA Actualizado', async () => {
    await planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Edición Extraordinaria de Auditorías');
    await expect(registro.botonActaModificacion).toBeVisible({ timeout: 60_000 });
    await expect(registro.botonAnadir, 'en la edición extraordinaria no se añaden auditorías').toBeHidden();
    const modal = await registro.editarAuditoria('E2E cargue 2', { extraordinaria: true });
    await modal.elegir('cronograma', 'Julio');
    await modal.botonGuardar.click();
    const avisos = await resolverAlertas(page);
    expect(avisos.join(' ')).toContain('Esta auditoría se encuentra en el estado');
    await expect(registro.filaAuditoria('E2E cargue 2')).toContainText('Julio', { timeout: 60_000 });

    await registro.botonRegresar.click();
    await expect(registro.alerta, 'no deja salir sin el acta de modificación').toContainText('No ha subido un Acta de Modificación');
    await registro.confirmarAlerta();

    await registro.subirActaModificacion(path.join(FIXTURES, 'acta-e2e.pdf'));
    expect((await resolverAlertas(page)).join(' ')).toContain('Archivo subido exitosamente');
    const guardado = await ciclo.guardarPaa({ nombre: 'subida del Formato PAA Actualizado' });
    expect(guardado.join(' ')).toContain('edición extraordinaria');
    await ciclo.captura('PAA guardado por edición extraordinaria', page, true);
  });

  await test.step('el PAA muestra el Formato PAA Actualizado y el historial de ediciones extraordinarias', async () => {
    await planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Ver Documentos');
    const documentos = new DocumentosDialog(page);
    await documentos.esperarCarga();
    await documentos.elegirPestana('Formato PAA Actualizado');
    await expect(documentos.visor).toBeVisible({ timeout: 60_000 });
    await ciclo.captura('Formato PAA Actualizado');
    await documentos.cerrar();

    await planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Historial de Ediciones Extraordinarias');
    const actas = new DocumentosDialog(page, 'Actas de Modificación extraordinaria');
    await actas.esperarCarga();
    const registradas = (await api.documentosDelPlan(ciclo.planId)).filter((d: any) => d.tipo_id === TIPO_DOCUMENTO.ACTA_MODIFICACION_PLAN);
    expect(registradas, 'el acta de modificación quedó registrada para el plan').toHaveLength(1);
    // Las pestañas de este diálogo salen de los documentos descargados: aparecen cuando termina la descarga.
    await expect.poll(() => actas.pestanas().then((p) => p.length), { message: 'el historial muestra el acta de la edición', timeout: 60_000 }).toBeGreaterThan(0);
    await expect(actas.visor).toBeVisible({ timeout: 60_000 });
    await ciclo.captura('historial de ediciones extraordinarias');
    await actas.cerrar();
  });

  await test.step('cada cambio de estado del PAA registra quién lo hizo y, donde la aplicación lo envía, con qué rol', async () => {
    const estados = await api.estadosDelPlan(ciclo.planId);
    const resumen = estados.map((e: any) => `${e.estado_id} usuario_id=${e.usuario_id ?? '-'} usuario_rol=${e.usuario_rol ?? '-'}`).join('\n');
    await testInfo.attach('estados del PAA', { body: resumen, contentType: 'text/plain' });
    for (const e of estados) expect(e.usuario_id, `estado ${e.estado_id} sin usuario_id`).toBeTruthy();
    // La aprobación del jefe (APROBADO_JEFE, EN_REVISION_SECRETARIO) no envía usuario_rol (D34, hallazgo en la issue).
    const conRol = [PLAN_ESTADO.EN_BORRADOR_ID, PLAN_ESTADO.EN_REVISION_JEFE_ID, PLAN_ESTADO.APROBADO_SECRETARIO_ID];
    for (const e of estados.filter((x: any) => conRol.includes(x.estado_id))) {
      expect(e.usuario_rol, `estado ${e.estado_id} sin usuario_rol`).toBeTruthy();
    }
  });

  await ciclo.adjuntarCorreos();
});
