import { NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { UserService } from 'src/app/core/services/user.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DescargaService } from 'src/app/shared/services/descarga.service';
import { ParametrosUtilsService } from 'src/app/shared/services/parametros.service';
import { VistaAuditadoComponent } from './vista-auditado.component';

const ESTADO = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;

const fila = (no: string, estadoId: number, extra: object = {}) => ({
  auditoria_id: `a${no}`, no_auditoria: no, vigencia_nombre: '2025', titulo: `Auditoría ${no}`,
  tipo_evaluacion_nombre: 'Auditoría Interna', auditores_auditoria: [], auditores_plan: [],
  dependencia_nombre: 'Dependencia', plan_mejoramiento_id: null, estado_plan_id: estadoId,
  estado_plan_nombre: '', total_hallazgos: 0, total_observaciones: 0, ...extra,
});

const auditorias = [
  fila('1', ESTADO.SIN_PLAN_MEJORAMIENTO),
  fila('2', ESTADO.CREANDO_PLAN_MEJORAMIENTO, { plan_mejoramiento_id: 'p2' }),
  fila('3', ESTADO.RECHAZADO_PLAN_MEJORAMIENTO, { plan_mejoramiento_id: 'p3', total_observaciones: 2 }),
];

/** Simula el MID: filtra por estado_ids como lo hace el endpoint real. */
const midGet = jest.fn((endpoint: string) => {
  if (endpoint.includes('/resumen?')) {
    return of({ Data: { auditorias_finalizadas: 3, sin_formular: 1, en_formulacion: 2, en_revision: 0, aprobados: 0 } });
  }
  const estados = (new URLSearchParams(endpoint.split('?')[1]).get('estado_ids') ?? '').split(',').filter(Boolean).map(Number);
  const data = auditorias.filter((a) => !estados.length || estados.includes(a.estado_plan_id));
  return of({ Data: data, MetaData: { Count: data.length } });
});

describe('VistaAuditadoComponent', () => {
  let component: VistaAuditadoComponent;
  const router = { navigate: jest.fn() };
  const dialog = { open: jest.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VistaAuditadoComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: MatDialog, useValue: dialog },
        { provide: PlanAnualAuditoriaMid, useValue: { get: midGet } },
        { provide: ParametrosUtilsService, useValue: { getVigencias: () => of([{ Id: 1, Nombre: '2025' }]) } },
        { provide: UserService, useValue: { getPersonaId: () => Promise.resolve(10) } },
        { provide: AlertService, useValue: { showAlert: jest.fn(), showErrorAlert: jest.fn() } },
        { provide: DescargaService, useValue: { descargarArchivoBuffer: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    component = TestBed.createComponent(VistaAuditadoComponent).componentInstance;
    component.rol = environment.ROL.JEFE_DEPENDENCIA;
    await component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('consulta los endpoints del auditado con persona, cargo y filtros', () => {
    const endpoints = midGet.mock.calls.map(([e]) => e);
    expect(endpoints).toContain(`plan-mejoramiento/formulacion/auditado/10/${environment.CARGO.JEFE_DEPENDENCIA_ID}/resumen?vigencia_id=1&tipo_evaluacion_id=${environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID}`);
    expect(endpoints.some((e) => e.startsWith(`plan-mejoramiento/formulacion/auditado/10/${environment.CARGO.JEFE_DEPENDENCIA_ID}?`) && e.includes('limit=10&offset=0'))).toBe(true);
  });

  it('muestra observaciones del auditor solo en planes rechazados con observaciones', () => {
    const porNumero = (no: string) => component.dataSource.data.find((f) => f.no_auditoria === no);
    expect(porNumero('3')?.mostrarObservaciones).toBe(true);
    expect(porNumero('2')?.mostrarObservaciones).toBe(false);
  });

  it('preselecciona la vigencia más reciente y carga indicadores y tabla', () => {
    expect(component.filtrosForm.value.vigencia).toBe(1);
    expect(component.resumen).not.toBeNull();
    expect(component.dataSource.data.length).toBe(component.totalRegistros);
  });

  it('filtra la tabla con los chips de acceso rápido', () => {
    component.seleccionarGrupo('EN_FORMULACION');

    const estados = component.dataSource.data.map((f) => f.estado_plan_id);
    expect(estados.length).toBeGreaterThan(0);
    expect(estados.every((e) => [ESTADO.CREANDO_PLAN_MEJORAMIENTO, ESTADO.RECHAZADO_PLAN_MEJORAMIENTO].includes(e))).toBe(true);
  });

  it('limpiar filtros vuelve a todos los estados', () => {
    component.seleccionarGrupo('APROBADOS');
    component.limpiarFiltros();

    expect(component.filtrosForm.value.grupoEstado).toBe('TODOS');
    expect(component.dataSource.data.length).toBe(component.totalRegistros);
  });

  it('solo ofrece las acciones habilitadas para el auditado (sin Enviar a Revisión)', () => {
    const accionesDe = (estadoId: number) =>
      component.dataSource.data.find((f) => f.estado_plan_id === estadoId)?.acciones;

    expect(accionesDe(ESTADO.SIN_PLAN_MEJORAMIENTO)).toEqual(['Registrar Plan']);
    expect(accionesDe(ESTADO.CREANDO_PLAN_MEJORAMIENTO)).toEqual(['Registrar Plan']);
    expect(accionesDe(ESTADO.RECHAZADO_PLAN_MEJORAMIENTO)).toEqual(['Registrar Plan', 'Ver Observaciones']);
  });

  it('Registrar Plan navega a la ruta existente', () => {
    const fila = component.dataSource.data[0];
    component.realizarAccion(fila, 'Registrar Plan');

    expect(router.navigate).toHaveBeenCalledWith([`/plan-mejoramiento/registrar-plan/${fila.auditoria_id}`]);
  });

  it('abre el flujo institucional en un modal', () => {
    const plantilla = {} as TemplateRef<unknown>;
    component.abrirFlujo(plantilla);

    expect(dialog.open).toHaveBeenCalledWith(plantilla, expect.objectContaining({ ariaLabel: 'Flujo Institucional del Plan de Mejoramiento' }));
  });
});
