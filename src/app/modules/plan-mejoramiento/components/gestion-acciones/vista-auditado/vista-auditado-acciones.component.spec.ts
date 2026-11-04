import { NO_ERRORS_SCHEMA } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { VistaAuditadoAccionesComponent } from "./vista-auditado-acciones.component";

const tipoEvaluacionId = environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID;

const accion = (id: string, grupo: string, extra: object = {}) => ({
  accion_id: id, plan_mejoramiento_id: "p1", auditoria_id: "a1", no_auditoria: "1",
  nombre_auditoria: "Sistemas", tipo_evaluacion_nombre: "Auditoría Interna", no_hallazgo: "1.1.1",
  descripcion_hallazgo: "Hallazgo", no_accion: `2025-${id}`, tipo_accion_nombre: "Correctiva",
  descripcion_accion: "Acción", dependencia_lider: "Oficina A", dependencias_apoyo: [],
  auditores_plan: [], fecha_inicio: null, fecha_fin: null, en_revision: grupo === "CARGUE_ABIERTO",
  total_soportes: 0, calificacion: null, fecha_calificacion: null, grupo, eficaz: false,
  en_riesgo: false, dias_para_vencer: null, auditor_plan_asignado: false, ...extra,
});

const acciones = [accion("1", "CARGUE_ABIERTO"), accion("2", "EN_REVISION"), accion("3", "CALIFICADAS", { calificacion: 85, eficaz: true })];

const resumen = { total: 3, pendiente_habilitar: 0, cargue_abierto: 1, en_revision: 1, calificadas: 1, eficaces: 1, en_riesgo: 0 };

const midGet = jest.fn((endpoint: string) => {
  if (endpoint.includes("/resumen?")) return of({ Data: resumen });
  return of({ Data: acciones, MetaData: { Count: acciones.length } });
});

describe("VistaAuditadoAccionesComponent", () => {
  const router = { navigate: jest.fn() };
  const route = {};
  const dialog = { open: jest.fn() };
  const alerta = { showAlert: jest.fn(), showErrorAlert: jest.fn() };
  let component: VistaAuditadoAccionesComponent;

  const crear = async (rol: string) => {
    component = TestBed.createComponent(VistaAuditadoAccionesComponent).componentInstance;
    component.rol = rol;
    await component.ngOnInit();
  };

  const consultas = () => midGet.mock.calls.map(([e]) => e);
  const consultasDeTabla = () => consultas().filter((e) => !e.includes("/resumen?"));

  beforeEach(async () => {
    midGet.mockClear();
    router.navigate.mockClear();
    dialog.open.mockClear();
    alerta.showAlert.mockClear();

    await TestBed.configureTestingModule({
      declarations: [VistaAuditadoAccionesComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: MatDialog, useValue: dialog },
        { provide: PlanAnualAuditoriaMid, useValue: { get: midGet } },
        { provide: ParametrosUtilsService, useValue: { getVigencias: () => of([{ Id: 1, Nombre: "2025" }]) } },
        { provide: UserService, useValue: { getPersonaId: () => Promise.resolve(10) } },
        { provide: AlertService, useValue: alerta },
        { provide: DescargaService, useValue: { descargarArchivoBuffer: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => component.ngOnDestroy());

  it("el jefe de dependencia consulta con su persona y el cargo 312", async () => {
    await crear(environment.ROL.JEFE_DEPENDENCIA);

    const cargo = environment.CARGO.JEFE_DEPENDENCIA_ID;
    expect(cargo).toBe(312);
    expect(consultas()).toContain(`gestion-accion/auditado/10/${cargo}/resumen?vigencia_id=1&tipo_evaluacion_id=${tipoEvaluacionId}`);
    expect(consultasDeTabla()).toContain(`gestion-accion/auditado/10/${cargo}?vigencia_id=1&tipo_evaluacion_id=${tipoEvaluacionId}&limit=25&offset=0`);
  });

  it("el asistente de dependencia consulta con el cargo 320", async () => {
    await crear(environment.ROL.ASISTENTE_DEPENDENCIA);

    expect(environment.CARGO.ASISTENTE_DEPENDENCIA_ID).toBe(320);
    expect(consultasDeTabla()[0]).toContain("gestion-accion/auditado/10/320?");
  });

  it("asigna a cada fila el botón que le corresponde", async () => {
    await crear(environment.ROL.JEFE_DEPENDENCIA);

    const etiquetas = component.dataSource.data.map((f) => f.boton.etiqueta);
    expect(etiquetas).toEqual(["Registrar Avances", "Ver Acción", "Ver Calificación"]);
    expect(component.dataSource.data.map((f) => f.estado.texto)).toEqual(["Cargue abierto", "En revisión OCI", "Calificada"]);
    expect(component.totalRegistros).toBe(3);
    expect(component.resumen).toEqual(resumen);
  });

  it("seleccionarGrupo envía el grupo y no recarga el resumen", async () => {
    await crear(environment.ROL.JEFE_DEPENDENCIA);
    const resumenesAntes = consultas().filter((e) => e.includes("/resumen?")).length;

    component.seleccionarGrupo("EN_RIESGO");

    expect(consultasDeTabla().at(-1)).toContain("grupo=EN_RIESGO");
    expect(consultas().filter((e) => e.includes("/resumen?")).length).toBe(resumenesAntes);
  });

  it("limpiarFiltros conserva la vigencia y el tipo de evaluación", async () => {
    await crear(environment.ROL.JEFE_DEPENDENCIA);
    component.filtrosForm.patchValue({ noAuditoria: "12", dependencia: "Oficina", grupo: "CALIFICADAS" });

    component.limpiarFiltros();

    expect(component.filtrosForm.value).toMatchObject({
      vigencia: 1, tipoEvaluacion: tipoEvaluacionId, noAuditoria: "", dependencia: "", grupo: "TODOS",
    });
    expect(consultasDeTabla().at(-1)).not.toContain("no_auditoria");
  });

  it("escribir en un filtro no consulta hasta aplicarFiltros", async () => {
    await crear(environment.ROL.JEFE_DEPENDENCIA);
    const antes = midGet.mock.calls.length;

    component.filtrosForm.get("noAuditoria")!.setValue(" 12 ");
    expect(midGet.mock.calls.length).toBe(antes);

    component.aplicarFiltros();
    expect(midGet.mock.calls.length).toBe(antes + 1);
    expect(consultasDeTabla().at(-1)).toContain("no_auditoria=12");
  });

  it("no consulta si la fecha final es anterior a la inicial", async () => {
    await crear(environment.ROL.JEFE_DEPENDENCIA);
    const antes = midGet.mock.calls.length;
    component.filtrosForm.patchValue({ desde: new Date(2025, 5, 10), hasta: new Date(2025, 5, 1) });

    component.aplicarFiltros();

    expect(midGet.mock.calls.length).toBe(antes);
    expect(alerta.showAlert).toHaveBeenCalledWith("Rango inválido", expect.any(String));
  });

  it("envía las fechas como yyyy-MM-dd", async () => {
    await crear(environment.ROL.JEFE_DEPENDENCIA);
    component.filtrosForm.patchValue({ desde: new Date(2025, 0, 5), hasta: new Date(2025, 11, 31) });

    component.aplicarFiltros();

    expect(consultasDeTabla().at(-1)).toContain("desde=2025-01-05&hasta=2025-12-31");
  });

  it("abrirAccion navega a registrar-avances de la acción", async () => {
    await crear(environment.ROL.JEFE_DEPENDENCIA);

    component.abrirAccion(component.dataSource.data[0]);

    expect(router.navigate).toHaveBeenCalledWith(["registrar-avances", "1"], { relativeTo: route });
  });

  it("verHistorial abre el historial de calificaciones de la acción", async () => {
    await crear(environment.ROL.JEFE_DEPENDENCIA);

    component.verHistorial(component.dataSource.data[0]);

    expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      data: expect.objectContaining({
        auditoriaId: "1", estadoEndpoint: "calificacion-accion", auditoriaIdReferencia: "accion_mejora_id",
      }),
    }));
  });
});
