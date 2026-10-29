// spec: e2e/specs/programacion.plan.md
import path from 'node:path';
import { test, expect } from '../../core/fixtures';
import { resolverAlertas } from '../../pages/alertas';
import { EnviarAprobacionDialog } from '../../pages/dialogos-plan.page';
import { MarcoGeneralPage, SECCIONES_MARCO } from '../../pages/marco-general.page';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { RegistrarAuditoriasPage, type DatosAuditoria } from '../../pages/registrar-auditorias.page';
import { RevisionPlanPage } from '../../pages/revision-plan.page';
import { VIGENCIA_APROBADA, VIGENCIA_E2E } from './datos';
import { ApiProgramacion, esperarSubidaGestor, interceptarCorreos, marcadorE2E, ocultarPlanesBorrados, tokenDe } from './limpieza';

const FIXTURES = path.resolve(__dirname, '../../fixtures');

test('ciclo completo del PAA: el auditor experto lo arma, el jefe lo aprueba con firma y el secretario con el acta', { tag: ['@programacion', '@auditor-experto', '@escritura'] }, async ({ page, context, request, limpieza, comoRol }, testInfo) => {
  test.setTimeout(20 * 60_000);
  const marca = marcadorE2E();
  const api = new ApiProgramacion(request, () => tokenDe(page));
  const correos = await interceptarCorreos(context, testInfo);
  await ocultarPlanesBorrados(context);
  const planes = new PlanAuditoriaPage(page);
  await planes.abrir();

  let planId = '';
  await test.step(`la vigencia ${VIGENCIA_E2E} queda libre para la prueba`, async () => {
    await api.liberarVigencia(VIGENCIA_E2E);
  });

  await test.step(`no se puede crear un PAA en una vigencia que ya tiene (${VIGENCIA_APROBADA})`, async () => {
    await planes.elegirVigenciaNueva(VIGENCIA_APROBADA);
    await planes.botonCrear.click();
    await expect(planes.alerta).toBeVisible({ timeout: 60_000 });
    expect(await planes.textoAlerta()).toMatch(/error|existe/i);
    await testInfo.attach('vigencia repetida', { body: await page.screenshot(), contentType: 'image/png' });
    await planes.confirmarAlerta();
  });

  await test.step(`el auditor experto crea el PAA ${VIGENCIA_E2E} en Borrador`, async () => {
    planId = await planes.crearPlan(VIGENCIA_E2E);
    limpieza.registrar(`borrar el PAA ${VIGENCIA_E2E} de la prueba (${planId}) y lo que cuelga de él`, () => api.borrarPlan(planId));
    expect((await resolverAlertas(page)).join(' ')).toContain('creado correctamente en estado Borrador');
    await expect((await planes.filaDeHoy(VIGENCIA_E2E))).toContainText('Borrador');
  });

  const marco = new MarcoGeneralPage(page);
  await test.step('llena y guarda el marco general', async () => {
    await planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Editar Marco General');
    await marco.esperarCarga();
    for (const seccion of SECCIONES_MARCO) {
      await marco.campo(seccion).fill(`${marca} ${seccion} del PAA de prueba automatizada.\nSegunda línea.`);
    }
    await marco.botonGuardar.click();
    await resolverAlertas(page);
    await testInfo.attach('marco general guardado', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  const registro = new RegistrarAuditoriasPage(page);
  const manual: DatosAuditoria = {
    nombre: `${marca} auditoría manual`,
    tipoEvaluacion: 'Auditoría Interna',
    macroprocesos: ['Gestión Académica'],
    procesos: ['Gestión de Docencia'],
    dependencias: ['INGENIERIA TOPOGRAFICA'],
    cronograma: ['Marzo'],
    cantidad: 1,
  };
  await test.step('registra una auditoría llenando todos los campos', async () => {
    await planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Registrar Auditorías');
    await expect(registro.botonAnadir).toBeVisible({ timeout: 60_000 });
    const modal = await registro.abrirNuevaAuditoria();
    await modal.llenar(manual);
    await testInfo.attach('formulario lleno', { body: await page.screenshot(), contentType: 'image/png' });
    await modal.botonGuardar.click();
    await resolverAlertas(page);
    await expect(registro.filaAuditoria(manual.nombre)).toBeVisible({ timeout: 60_000 });
  });

  await test.step('carga dos auditorías más con el cargue masivo', async () => {
    const cargue = await registro.cargueMasivo(path.join(FIXTURES, 'cargue-masivo-e2e.xlsx'));
    await testInfo.attach('cargue masivo en el MID', { body: `${cargue.status} en ${cargue.segundos} s`, contentType: 'text/plain' });
    expect(cargue.status, 'el MID procesa el cargue masivo').toBeLessThan(300);
    await resolverAlertas(page);
    await expect(registro.filaAuditoria('E2E cargue 1')).toBeVisible({ timeout: 60_000 });
    await expect(registro.filaAuditoria('E2E cargue 2')).toBeVisible();
    await expect(registro.filaAuditoria('E2E cargue 2')).toContainText('Gestión de la Información Bibliográfica');
    await testInfo.attach('auditorías registradas', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('previsualiza el Formato PAA y guarda el PAA', async () => {
    const visor = await registro.verPdf();
    await testInfo.attach('Formato PAA', { body: await page.screenshot(), contentType: 'image/png' });
    await page.keyboard.press('Escape');
    await expect(visor).toBeHidden();
    // Guardar sube el Formato PAA al gestor documental y después avisa el éxito; la subida se mide para el
    // reporte (es la parte lenta del ambiente de pruebas).
    const subida = esperarSubidaGestor(page);
    await registro.botonGuardar.click();
    await resolverAlertas(page);
    const { status, segundos } = await subida;
    await testInfo.attach('subida del Formato PAA al gestor documental', { body: `${status} en ${segundos} s`, contentType: 'text/plain' });
    expect(status, 'el Formato PAA se sube al gestor documental').toBe(200);
  });

  await test.step('envía el PAA a aprobación del jefe', async () => {
    await planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Enviar Aprobación');
    const envio = new EnviarAprobacionDialog(page);
    await expect(envio.dialogo).toBeVisible();
    await envio.observacion.fill(`${marca} envío de prueba automatizada`);
    // Con las notificaciones deshabilitadas (environment), la aplicación no muestra el aviso de éxito
    // (#888 H-07): el envío se verifica por el nuevo estado registrado y por el listado.
    // El envío regenera el Formato PAA, lo sube al gestor documental y después registra el estado.
    const subida = esperarSubidaGestor(page);
    const estado = page.waitForResponse(
      (r) => r.request().method() === 'POST' && /\/plan_anual_auditoria_crud\/v1\/estado$/.test(new URL(r.url()).pathname),
      { timeout: 8 * 60_000 },
    );
    await envio.botonEnviar.click();
    const { status, segundos } = await subida;
    await testInfo.attach('subida del Formato PAA al enviar', { body: `${status} en ${segundos} s`, contentType: 'text/plain' });
    expect(status, 'el Formato PAA regenerado se sube al gestor documental').toBe(200);
    expect((await estado).status(), 'se registra el estado "En revisión por jefe"').toBe(201);
    if (await planes.alerta.isVisible()) await resolverAlertas(page);
    await planes.abrir();
    await expect(await planes.filaDeHoy(VIGENCIA_E2E)).toContainText(/Revisión por Jefe/i);
    await testInfo.attach('enviado al jefe', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('el jefe OCI revisa el PAA y lo aprueba con su firma', async () => {
    const jefe = await comoRol('jefe-oci');
    correos.push(...(await interceptarCorreos(jefe.context(), testInfo)));
    await ocultarPlanesBorrados(jefe.context());
    const planesJefe = new PlanAuditoriaPage(jefe);
    await planesJefe.accionDePlanDeHoy(VIGENCIA_E2E, 'Ver Plan');
    const revision = new RevisionPlanPage(jefe, 'jefe');
    await revision.esperarCarga();
    await testInfo.attach('revisión del jefe', { body: await jefe.screenshot({ fullPage: true }), contentType: 'image/png' });
    await revision.botonAprobar.click();
    const avisos = await resolverAlertas(jefe, { timeout: 6 * 60_000 });
    await testInfo.attach('avisos de la aprobación del jefe', { body: avisos.join('\n'), contentType: 'text/plain' });
    await planesJefe.abrir();
    await expect(await planesJefe.filaDeHoy(VIGENCIA_E2E)).toContainText(/Comité/i);
  });

  await test.step('el secretario aprueba el PAA con el Acta de CCCI y se generan las auditorías', async () => {
    const secretario = await comoRol('secretario');
    correos.push(...(await interceptarCorreos(secretario.context(), testInfo)));
    await ocultarPlanesBorrados(secretario.context());
    const planesSecretario = new PlanAuditoriaPage(secretario);
    await planesSecretario.accionDePlanDeHoy(VIGENCIA_E2E, 'Ver Plan');
    const revision = new RevisionPlanPage(secretario, 'secretario');
    await revision.esperarCarga();
    const acta = await revision.abrirAprobacionSecretario();
    await acta.adjuntar(path.join(FIXTURES, 'acta-e2e.pdf'));
    await testInfo.attach('acta adjunta', { body: await secretario.screenshot(), contentType: 'image/png' });
    await acta.botonAprobar.click();
    // "Archivo subido exitosamente." → (genera las auditorías y registra el estado) → "Plan aprobado exitosamente."
    const avisos = await resolverAlertas(secretario, { timeout: 6 * 60_000, hasta: /Plan aprobado exitosamente/ });
    await testInfo.attach('avisos de la aprobación del secretario', { body: avisos.join('\n'), contentType: 'text/plain' });
    await planesSecretario.abrir();
    await expect(await planesSecretario.filaDeHoy(VIGENCIA_E2E)).toContainText(/Aprobado por Comité Coordinador/i);
  });

  await test.step('el PAA aprobado generó una auditoría por cada una de las cantidades registradas', async () => {
    const generadas = await api.auditoriasDelPlan(planId);
    // manual (1) + "E2E cargue 1" (1) + "E2E cargue 2" (2)
    expect(generadas.length).toBe(4);
  });

  await testInfo.attach('correos interceptados', { body: correos.join('\n') || '(ninguno)', contentType: 'text/plain' });
});
