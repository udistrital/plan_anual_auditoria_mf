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
import { VistaAuditorAccionesComponent } from "./vista-auditor-acciones.component";

const accion = (id: string, grupo: string, asignado: boolean) => ({
  accion_id: id, plan_mejoramiento_id: "p1", auditoria_id: "a1", no_auditoria: "1",
  nombre_auditoria: "Sistemas", tipo_evaluacion_nombre: "Auditoría Interna", no_hallazgo: "1.1.1",
  descripcion_hallazgo: "Hallazgo", no_accion: `2025-${id}`, tipo_accion_nombre: "Correctiva",
  descripcion_accion: "Acción", dependencia_lider: "Oficina A", dependencias_apoyo: [],
  auditores_plan: [], fecha_inicio: null, fecha_fin: null, en_revision: grupo === "CARGUE_ABIERTO",
  total_soportes: 0, calificacion: null, fecha_calificacion: null, grupo, eficaz: false,
  en_riesgo: false, dias_para_vencer: null, auditor_plan_asignado: asignado,
});

const acciones = [
  accion("1", "PENDIENTE_HABILITAR", true),
  accion("2", "EN_REVISION", true),
  accion("3", "EN_REVISION", false),
];

let accionesRespuesta: any[] = acciones;

const midGet = jest.fn((endpoint: string) => {
  if (endpoint.includes("/resumen?")) return of({ Data: null });
  return of({ Data: accionesRespuesta, MetaData: { Count: accionesRespuesta.length } });
});

const midPost = jest.fn((endpoint: string) => of({
  plan_mejoramiento_id: endpoint.split("/")[1],
  ya_numerado: false,
  acciones: [{ accionId: "4", no_accion: "2025-1-111-1" }, { accionId: "5", no_accion: "2025-1-111-2" }],
}));

describe("VistaAuditorAccionesComponent", () => {
  let component: VistaAuditorAccionesComponent;

  const crear = async (rol: string) => {
    component = TestBed.createComponent(VistaAuditorAccionesComponent).componentInstance;
    component.rol = rol;
    await component.ngOnInit();
  };

  const consultas = () => midGet.mock.calls.map(([e]) => e);

  beforeEach(async () => {
    midGet.mockClear();
    midPost.mockClear();
    accionesRespuesta = acciones;

    await TestBed.configureTestingModule({
      declarations: [VistaAuditorAccionesComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: ActivatedRoute, useValue: {} },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: PlanAnualAuditoriaMid, useValue: { get: midGet, post: midPost } },
        { provide: ParametrosUtilsService, useValue: { getVigencias: () => of([{ Id: 1, Nombre: "2025" }]) } },
        { provide: UserService, useValue: { getPersonaId: () => Promise.resolve(10) } },
        { provide: AlertService, useValue: { showAlert: jest.fn(), showErrorAlert: jest.fn() } },
        { provide: DescargaService, useValue: { descargarArchivoBuffer: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => component.ngOnDestroy());

  it.each([environment.ROL.JEFE, environment.ROL.AUDITOR_EXPERTO])("%s consulta con alcance=todas", async (rol) => {
    await crear(rol);

    expect(consultas().every((e) => e.includes("alcance=todas"))).toBe(true);
    expect(consultas().every((e) => e.startsWith("gestion-accion/auditor/10"))).toBe(true);
  });

  it.each([environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE])("%s consulta con alcance=asignadas", async (rol) => {
    await crear(rol);

    expect(consultas().every((e) => e.includes("alcance=asignadas"))).toBe(true);
  });

  it("solo ofrece habilitar y calificar en los planes donde es auditor", async () => {
    await crear(environment.ROL.AUDITOR);

    const etiquetas = component.dataSource.data.map((f) => f.boton.etiqueta);
    expect(etiquetas).toEqual(["Habilitar Cargue", "Calificar", "Ver Acción"]);
  });

  it("no pide numerar cuando todas las acciones tienen número", async () => {
    await crear(environment.ROL.AUDITOR);

    expect(midPost).not.toHaveBeenCalled();
  });

  it("numera una vez por plan las acciones sin número y actualiza las filas", async () => {
    accionesRespuesta = [
      ...acciones,
      { ...accion("4", "EN_REVISION", true), plan_mejoramiento_id: "p2", no_accion: "" },
      { ...accion("5", "EN_REVISION", true), plan_mejoramiento_id: "p2", no_accion: "" },
    ];
    await crear(environment.ROL.AUDITOR);

    expect(midPost.mock.calls.map(([e]) => e)).toEqual(["plan-mejoramiento/p2/numerar-acciones"]);
    expect(component.dataSource.data.map((f) => f.no_accion)).toEqual([
      "2025-1", "2025-2", "2025-3", "2025-1-111-1", "2025-1-111-2",
    ]);

    component.aplicarFiltros();
    expect(midPost).toHaveBeenCalledTimes(1);
  });

  it("sin resumen las tarjetas quedan en cero", async () => {
    await crear(environment.ROL.AUDITOR);

    expect(component.resumen).toBeNull();
  });
});
