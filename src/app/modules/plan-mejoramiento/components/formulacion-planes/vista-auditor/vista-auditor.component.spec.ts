import { NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { UserService } from 'src/app/core/services/user.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DescargaService } from 'src/app/shared/services/descarga.service';
import { ParametrosUtilsService } from 'src/app/shared/services/parametros.service';
import { ModalAsignacionAuditoresComponent } from '../../plan-de-mejoramiento/ tabla-plan-mejoramiento/modal-asignacion-auditores/modal-asignacion-auditores.component';
import { VistaAuditorComponent } from './vista-auditor.component';

const ESTADO = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;
const RUTA = 'plan-mejoramiento/formulacion/auditor/10';

const fila = (no: string, estadoId: number, extra: object = {}) => ({
  auditoria_id: `a${no}`, no_auditoria: no, vigencia_nombre: '2025', titulo: `Auditoría ${no}`,
  tipo_evaluacion_nombre: 'Auditoría Interna', auditores_auditoria: ['Pepito Pérez'], auditores_plan: [],
  dependencia_nombre: 'Dependencia', plan_mejoramiento_id: `p${no}`, estado_plan_id: estadoId,
  estado_plan_nombre: '', total_hallazgos: 0, total_observaciones: 0,
  fecha_inicio: '2025-01-10', fecha_fin: '2025-01-30', fecha_estado: null,
  total_acciones: 0, acciones_aprobadas: 0, asignada: true, ...extra,
});

const auditorias = [
  fila('1', ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR, { fecha_estado: '2025-02-12T10:00:00', total_acciones: 4, acciones_aprobadas: 1 }),
  fila('2', ESTADO.RECHAZADO_PLAN_MEJORAMIENTO, { total_observaciones: 2, fecha_estado: '2025-02-10T10:00:00' }),
  fila('3', ESTADO.APROBADO_PLAN_MEJORAMIENTO, { asignada: false }),
];

/** Simula el MID: filtra por alcance y estado_ids como lo hace el endpoint real. */
const midGet = jest.fn((endpoint: string) => {
  const params = new URLSearchParams(endpoint.split('?')[1]);
  const visibles = auditorias.filter((a) => params.get('alcance') === 'todas' || a.asignada);
  if (endpoint.includes('/resumen?')) {
    return of({ Data: {
      total_auditorias: visibles.length, sin_formular: 0, en_formulacion: 0, en_revision: 1,
      con_observaciones: 1, aprobados: visibles.length - 2, total_asignadas: 2, total_institucion: 3,
    } });
  }
  const estados = (params.get('estado_ids') ?? '').split(',').filter(Boolean).map(Number);
  const data = visibles.filter((a) => !estados.length || estados.includes(a.estado_plan_id));
  return of({ Data: data, MetaData: { Count: data.length } });
});

describe('VistaAuditorComponent', () => {
  let component: VistaAuditorComponent;
  const router = { navigate: jest.fn() };
  const dialog = { open: jest.fn(() => ({ afterClosed: () => of(true) })) };

  async function crear(rol: string, get: jest.Mock = midGet): Promise<void> {
    await TestBed.configureTestingModule({
      declarations: [VistaAuditorComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: MatDialog, useValue: dialog },
        { provide: PlanAnualAuditoriaMid, useValue: { get } },
        { provide: ParametrosUtilsService, useValue: { getVigencias: () => of([{ Id: 1, Nombre: '2025' }, { Id: 2, Nombre: '2024' }]) } },
        { provide: UserService, useValue: { getPersonaId: () => Promise.resolve(10) } },
        { provide: AlertService, useValue: { showAlert: jest.fn(), showErrorAlert: jest.fn() } },
        { provide: DescargaService, useValue: { descargarArchivoBuffer: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    component = TestBed.createComponent(VistaAuditorComponent).componentInstance;
    component.rol = rol;
    await component.ngOnInit();
  }

  const llamadas = () => midGet.mock.calls.map(([e]) => e);

  beforeEach(() => jest.clearAllMocks());
  afterEach(() => component?.ngOnDestroy());

  describe('como JEFE_CONTROL_INTERNO', () => {
    beforeEach(() => crear(environment.ROL.JEFE));

    it('consulta resumen y tabla del auditor con sus auditorías asignadas', () => {
      expect(llamadas()).toContain(`${RUTA}/resumen?vigencia_id=1&tipo_evaluacion_id=${environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID}&alcance=asignadas`);
      expect(llamadas().some((e) => e.startsWith(`${RUTA}?`) && e.includes('limit=10&offset=0') && e.includes('alcance=asignadas'))).toBe(true);
      expect(component.dataSource.data.map((f) => f.auditoria_id)).toEqual(['a1', 'a2']);
    });

    it('muestra el selector de alcance con los totales del resumen', () => {
      expect(component.opcionesAlcance.map((o) => o.valor)).toEqual(['asignadas', 'todas']);
      expect(component.resumen?.total_asignadas).toBe(2);
      expect(component.resumen?.total_institucion).toBe(3);
    });

    it('al cambiar el alcance recarga indicadores y tabla con todas las auditorías', () => {
      midGet.mockClear();
      component.cambiarAlcance('todas');

      expect(llamadas().filter((e) => e.includes('alcance=todas'))).toHaveLength(2);
      expect(component.dataSource.data).toHaveLength(3);
      expect(component.resumen?.total_auditorias).toBe(3);
    });

    it('al cambiar la vigencia recarga indicadores y tabla desde la primera página', () => {
      component.pageIndex = 2;
      midGet.mockClear();
      component.filtrosForm.patchValue({ vigencia: 2 });
      component.recargar();

      expect(component.pageIndex).toBe(0);
      expect(llamadas()).toEqual([
        expect.stringContaining(`${RUTA}/resumen?vigencia_id=2`),
        expect.stringMatching(new RegExp(`^${RUTA}\\?vigencia_id=2.*offset=0`)),
      ]);
    });

    it('los chips de estado solo recargan la tabla', () => {
      midGet.mockClear();
      component.seleccionarGrupo('CON_OBSERVACIONES');

      expect(llamadas().some((e) => e.includes('/resumen?'))).toBe(false);
      expect(component.dataSource.data.map((f) => f.estado_plan_id)).toEqual([ESTADO.RECHAZADO_PLAN_MEJORAMIENTO]);
    });

    it('ofrece dictaminar el plan en revisión y marca el chip de rechazado', () => {
      const [enRevision, rechazado] = component.dataSource.data;

      expect(enRevision.acciones).toEqual(['Asignar Auditor(es)', 'Dictaminar Plan', 'Ver Observaciones']);
      expect(rechazado.claseEstado).toBe('estado-rechazado');
      expect(rechazado.mostrarObservaciones).toBe(true);
    });

    it('calcula la fecha y el plazo de cada fila', () => {
      const [enRevision, rechazado] = component.dataSource.data as any[];

      expect(enRevision.plazo.fecha).toBe('Rad: 12/02/2025');
      expect(rechazado.plazo.fecha).toBe('Devuelto: 10/02/2025');
    });

    it('Dictaminar Plan abre ver-plan', () => {
      const fila = component.dataSource.data[0];
      component.realizarAccion(fila as any, 'Dictaminar Plan');

      expect(router.navigate).toHaveBeenCalledWith([`/plan-mejoramiento/ver-plan/${fila.auditoria_id}`]);
    });

    it('Asignar Auditor(es) reutiliza el modal de asignación y recarga al guardar', () => {
      const fila = component.dataSource.data[0];
      midGet.mockClear();
      component.realizarAccion(fila as any, 'Asignar Auditor(es)');

      expect(dialog.open).toHaveBeenCalledWith(ModalAsignacionAuditoresComponent, expect.objectContaining({
        data: {
          auditoria: expect.objectContaining({
            titulo: 'Auditoría 1',
            planMejoramientoId: 'p1',
            auditores: [{ auditor_nombre: 'Pepito Pérez' }],
          }),
          usuarioId: 10,
          role: environment.ROL.JEFE,
        },
      }));
      expect(llamadas().some((e) => e.includes('/resumen?'))).toBe(true);
    });

    it('abre el flujo metodológico en un modal', () => {
      const plantilla = {} as TemplateRef<unknown>;
      component.abrirFlujo(plantilla);

      expect(dialog.open).toHaveBeenCalledWith(plantilla, expect.objectContaining({ ariaLabel: 'Flujo Metodológico de Evaluación y Dictamen OCI' }));
    });
  });

  describe('como AUDITOR_ASISTENTE', () => {
    beforeEach(() => crear(environment.ROL.AUDITOR_ASISTENTE));

    it('no muestra el selector de alcance y consulta solo sus asignadas', () => {
      expect(component.opcionesAlcance).toEqual([]);
      expect(llamadas().every((e) => e.includes('alcance=asignadas'))).toBe(true);
    });

    it('solo puede ver el plan en revisión, no dictaminarlo', () => {
      expect(component.dataSource.data[0].acciones).toContain('Ver Plan');
      expect(component.dataSource.data[0].acciones).not.toContain('Dictaminar Plan');
    });
  });

  it('descarta la respuesta de una consulta anterior si los filtros cambiaron', async () => {
    const respuestas = new Map<string, Subject<any>>();
    const getControlado = jest.fn((endpoint: string) => {
      const respuesta = new Subject<any>();
      respuestas.set(endpoint, respuesta);
      return respuesta;
    });
    await crear(environment.ROL.JEFE, getControlado);

    const primera = [...respuestas.keys()].find((e) => !e.includes('/resumen?'))!;
    component.seleccionarGrupo('APROBADOS');
    const segunda = [...respuestas.keys()].find((e) => e.includes('estado_ids'))!;

    respuestas.get(segunda)!.next({ Data: [auditorias[2]], MetaData: { Count: 1 } });
    respuestas.get(primera)!.next({ Data: auditorias, MetaData: { Count: 3 } });

    expect(component.dataSource.data.map((f) => f.auditoria_id)).toEqual(['a3']);
    expect(component.totalRegistros).toBe(1);
  });
});
