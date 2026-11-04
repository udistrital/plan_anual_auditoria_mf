/**
 * Pasos del ciclo del PAA que comparten los escenarios @escritura de Programación (D35 de la
 * especificación): el auditor experto arma y envía el PAA de la vigencia de E2E, el jefe OCI lo aprueba
 * con su firma y el secretario con el Acta de CCCI. Cada paso es un `test.step` con el criterio en
 * lenguaje de negocio, para que el reporte se lea igual que el escenario.
 */
import path from 'node:path';
import type { APIRequestContext, BrowserContext, Page, TestInfo } from '@playwright/test';
import { test, expect } from '../../core/fixtures';
import { resolverAlertas } from '../../pages/alertas';
import { EnviarAprobacionDialog } from '../../pages/dialogos-plan.page';
import { MarcoGeneralPage, SECCIONES_MARCO } from '../../pages/marco-general.page';
import { PlanAuditoriaPage } from '../../pages/plan-auditoria.page';
import { RegistrarAuditoriasPage, type DatosAuditoria } from '../../pages/registrar-auditorias.page';
import { RevisionPlanPage } from '../../pages/revision-plan.page';
import { VIGENCIA_E2E } from './datos';
import { ApiProgramacion, esperarSubidaGestor, interceptarCorreos, marcadorE2E, ocultarPlanesBorrados, personaDe, tokenDe } from './limpieza';

export const FIXTURES = path.resolve(__dirname, '../../fixtures');

/** Auditoría que se registra a mano en los ciclos que no necesitan más de una. */
export const auditoriaSimple = (marca: string): DatosAuditoria => ({
  nombre: `${marca} auditoría manual`,
  tipoEvaluacion: 'Auditoría Interna',
  macroprocesos: ['Gestión Académica'],
  procesos: ['Gestión de Docencia'],
  dependencias: ['INGENIERIA TOPOGRAFICA'],
  cronograma: ['Marzo'],
  cantidad: 1,
});

interface FixturesCiclo {
  page: Page;
  context: BrowserContext;
  request: APIRequestContext;
  limpieza: { registrar: (descripcion: string, accion: () => Promise<unknown>) => void };
  comoRol: (rol: string) => Promise<Page>;
}

export class CicloPaa {
  readonly marca = marcadorE2E();
  readonly api: ApiProgramacion;
  readonly planes: PlanAuditoriaPage;
  readonly registro: RegistrarAuditoriasPage;
  readonly correos: string[] = [];
  planId = '';
  private readonly paginas = new Map<string, Page>();

  private constructor(
    readonly f: FixturesCiclo,
    readonly testInfo: TestInfo,
  ) {
    this.api = new ApiProgramacion(f.request, () => tokenDe(f.page));
    this.planes = new PlanAuditoriaPage(f.page);
    this.registro = new RegistrarAuditoriasPage(f.page);
  }

  get page(): Page {
    return this.f.page;
  }

  /** Correos interceptados, listado sin planes borrados y la vigencia de E2E libre. */
  static async iniciar(f: FixturesCiclo, testInfo: TestInfo): Promise<CicloPaa> {
    const ciclo = new CicloPaa(f, testInfo);
    ciclo.correos.push(...(await interceptarCorreos(f.context, testInfo)));
    await ocultarPlanesBorrados(f.context);
    await ciclo.planes.abrir();
    await test.step(`la vigencia ${VIGENCIA_E2E} queda libre para la prueba`, async () => {
      await ciclo.api.liberarVigencia(VIGENCIA_E2E, await personaDe(f.page));
    });
    return ciclo;
  }

  /** Página del rol (una por rol durante el escenario), con los correos interceptados y sin planes borrados. */
  async como(rol: string): Promise<Page> {
    let pagina = this.paginas.get(rol);
    if (!pagina || pagina.isClosed()) {
      pagina = await this.f.comoRol(rol);
      this.correos.push(...(await interceptarCorreos(pagina.context(), this.testInfo)));
      await ocultarPlanesBorrados(pagina.context());
      this.paginas.set(rol, pagina);
    }
    return pagina;
  }

  async captura(nombre: string, pagina: Page = this.page, fullPage = false) {
    await this.testInfo.attach(nombre, { body: await pagina.screenshot({ fullPage }), contentType: 'image/png' });
  }

  adjuntarCorreos() {
    return this.testInfo.attach('correos interceptados', { body: this.correos.join('\n') || '(ninguno)', contentType: 'text/plain' });
  }

  async crearPaa() {
    await test.step(`el auditor experto crea el PAA ${VIGENCIA_E2E} en Borrador`, async () => {
      this.planId = await this.planes.crearPlan(VIGENCIA_E2E);
      const planId = this.planId;
      this.f.limpieza.registrar(`borrar el PAA ${VIGENCIA_E2E} de la prueba (${planId}) y lo que cuelga de él`, () => this.api.borrarPlan(planId));
      expect((await resolverAlertas(this.page)).join(' ')).toContain('creado correctamente en estado Borrador');
      await expect(await this.planes.filaDeHoy(VIGENCIA_E2E)).toContainText('Borrador');
    });
  }

  async abrirMarco(): Promise<MarcoGeneralPage> {
    await this.planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Editar Marco General');
    const marco = new MarcoGeneralPage(this.page);
    await marco.esperarCarga();
    await expect(marco.campo('Objetivo')).toBeVisible({ timeout: 60_000 });
    return marco;
  }

  async llenarMarco() {
    await test.step('llena y guarda el marco general', async () => {
      const marco = await this.abrirMarco();
      for (const seccion of SECCIONES_MARCO) {
        await marco.campo(seccion).fill(`${this.marca} ${seccion} del PAA de prueba automatizada.\nSegunda línea.`);
      }
      await marco.botonGuardar.click();
      await resolverAlertas(this.page);
      await this.captura('marco general guardado', this.page, true);
    });
  }

  async abrirRegistro() {
    await this.planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Registrar Auditorías');
    await expect(this.registro.botonAnadir).toBeVisible({ timeout: 60_000 });
  }

  /** Registra la auditoría desde la pantalla de Registrar (ya abierta). */
  async registrarAuditoria(datos: DatosAuditoria) {
    const modal = await this.registro.abrirNuevaAuditoria();
    await modal.llenar(datos);
    await this.captura(`formulario de "${datos.nombre}"`);
    await modal.botonGuardar.click();
    await resolverAlertas(this.page);
    await expect(this.registro.filaAuditoria(datos.nombre)).toBeVisible({ timeout: 60_000 });
  }

  /** Guardar (pantalla de Registrar): guarda el orden, genera el Formato PAA y lo sube al gestor documental. */
  async guardarPaa({ registro = this.registro, nombre = 'subida del Formato PAA al gestor documental' } = {}): Promise<string[]> {
    // La subida es la parte lenta del ambiente de pruebas: se mide para el reporte.
    const subida = esperarSubidaGestor(registro.page);
    await registro.botonGuardar.click();
    const avisos = await resolverAlertas(registro.page);
    const { status, segundos } = await subida;
    await this.testInfo.attach(nombre, { body: `${status} en ${segundos} s`, contentType: 'text/plain' });
    expect(status, 'el Formato PAA se sube al gestor documental').toBe(200);
    return avisos;
  }

  async enviarAJefe(observacion: string) {
    await test.step('envía el PAA a aprobación del jefe', async () => {
      await this.planes.accionDePlanDeHoy(VIGENCIA_E2E, 'Enviar Aprobación');
      const envio = new EnviarAprobacionDialog(this.page);
      await expect(envio.dialogo).toBeVisible();
      await envio.observacion.fill(observacion);
      // Con las notificaciones deshabilitadas (environment), la aplicación no muestra el aviso de éxito
      // (#888 H-07): el envío se verifica por el nuevo estado registrado y por el listado.
      // El envío regenera el Formato PAA, lo sube al gestor documental y después registra el estado.
      const subida = esperarSubidaGestor(this.page);
      const estado = this.page.waitForResponse(
        (r) => r.request().method() === 'POST' && /\/plan_anual_auditoria_crud\/v1\/estado$/.test(new URL(r.url()).pathname),
        { timeout: 8 * 60_000 },
      );
      await envio.botonEnviar.click();
      const { status, segundos } = await subida;
      await this.testInfo.attach('subida del Formato PAA al enviar', { body: `${status} en ${segundos} s`, contentType: 'text/plain' });
      expect(status, 'el Formato PAA regenerado se sube al gestor documental').toBe(200);
      expect((await estado).status(), 'se registra el estado "En revisión por jefe"').toBe(201);
      if (await this.planes.alerta.isVisible()) await resolverAlertas(this.page);
      await this.planes.abrir();
      await expect(await this.planes.filaDeHoy(VIGENCIA_E2E)).toContainText(/Revisión por Jefe/i);
      await this.captura('enviado al jefe');
    });
  }

  /** El revisor abre "Ver Plan" del PAA de la corrida. */
  async abrirRevision(rol: 'jefe-oci' | 'secretario'): Promise<RevisionPlanPage> {
    const pagina = await this.como(rol);
    await new PlanAuditoriaPage(pagina).accionDePlanDeHoy(VIGENCIA_E2E, 'Ver Plan');
    const revision = new RevisionPlanPage(pagina, rol === 'jefe-oci' ? 'jefe' : 'secretario');
    await revision.esperarCarga();
    return revision;
  }

  /** Aprobación del jefe: firma el Formato PAA Original y lo envía al secretario. */
  async aprobarComoJefe(revision?: RevisionPlanPage) {
    await test.step('el jefe OCI aprueba el PAA con su firma', async () => {
      revision ??= await this.abrirRevision('jefe-oci');
      await this.captura('revisión del jefe', revision.page, true);
      await revision.botonAprobar.click();
      const avisos = await resolverAlertas(revision.page, { timeout: 6 * 60_000 });
      await this.testInfo.attach('avisos de la aprobación del jefe', { body: avisos.join('\n'), contentType: 'text/plain' });
      const planes = new PlanAuditoriaPage(revision.page);
      await planes.abrir();
      await expect(await planes.filaDeHoy(VIGENCIA_E2E)).toContainText(/Comité/i);
    });
  }

  async aprobarComoSecretario() {
    await test.step('el secretario aprueba el PAA con el Acta de CCCI y se generan las auditorías', async () => {
      const revision = await this.abrirRevision('secretario');
      const acta = await revision.abrirAprobacionSecretario();
      await acta.adjuntar(path.join(FIXTURES, 'acta-e2e.pdf'));
      await this.captura('acta adjunta', revision.page);
      await acta.botonAprobar.click();
      // "Archivo subido exitosamente." → (genera las auditorías y registra el estado) → "Plan aprobado exitosamente."
      const avisos = await resolverAlertas(revision.page, { timeout: 6 * 60_000, hasta: /Plan aprobado exitosamente/ });
      await this.testInfo.attach('avisos de la aprobación del secretario', { body: avisos.join('\n'), contentType: 'text/plain' });
      const planes = new PlanAuditoriaPage(revision.page);
      await planes.abrir();
      await expect(await planes.filaDeHoy(VIGENCIA_E2E)).toContainText(/Aprobado por Comité Coordinador/i);
    });
  }

  /** El rol rechaza el PAA en su revisión con la observación (obligatoria). */
  async rechazar(rol: 'jefe-oci' | 'secretario', observacion: string) {
    const revision = await this.abrirRevision(rol);
    const rechazo = await revision.abrirRechazo();
    await rechazo.motivos.fill(observacion);
    await this.captura(`motivos del rechazo (${rol})`, revision.page);
    await rechazo.botonRechazar.click();
    const avisos = await resolverAlertas(revision.page);
    expect(avisos.join(' ')).toContain('El plan fue devuelto');
    const planes = new PlanAuditoriaPage(revision.page);
    await planes.abrir();
    await expect(await planes.filaDeHoy(VIGENCIA_E2E)).toContainText(/Rechazado/i);
  }

  /** PAA aprobado con una auditoría (para los escenarios que parten de ahí, D35). */
  async prepararPaaAprobado(auditoria: DatosAuditoria = auditoriaSimple(this.marca)) {
    await this.crearPaa();
    await this.llenarMarco();
    await test.step('registra una auditoría y guarda el PAA', async () => {
      await this.abrirRegistro();
      await this.registrarAuditoria(auditoria);
      await this.guardarPaa();
    });
    await this.enviarAJefe(`${this.marca} envío de prueba automatizada`);
    await this.aprobarComoJefe();
    await this.aprobarComoSecretario();
  }
}
