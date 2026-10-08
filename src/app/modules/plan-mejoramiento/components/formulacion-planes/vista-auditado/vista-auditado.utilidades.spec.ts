import { environment } from 'src/environments/environment';
import { I18nPluralPipe, NgLocaleLocalization } from '@angular/common';
import { columnasFormulacion, estadosDeGrupo, grupoDeEstado, pluralHallazgos, pluralObservaciones } from './vista-auditado.utilidades';

const ESTADO = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;

describe('vista-auditado.utilidades', () => {
  it('agrupa los estados del plan según el mockup', () => {
    expect(grupoDeEstado(ESTADO.SIN_PLAN_MEJORAMIENTO)).toBe('SIN_FORMULAR');
    expect(grupoDeEstado(ESTADO.CREANDO_PLAN_MEJORAMIENTO)).toBe('EN_FORMULACION');
    expect(grupoDeEstado(ESTADO.RECHAZADO_PLAN_MEJORAMIENTO)).toBe('EN_FORMULACION');
    expect(grupoDeEstado(ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR)).toBe('EN_REVISION');
    expect(grupoDeEstado(ESTADO.APROBADO_PLAN_MEJORAMIENTO)).toBe('APROBADOS');
    expect(grupoDeEstado(ESTADO.FIN_PLAN_MEJORAMIENTO)).toBe('APROBADOS');
  });

  it('no filtra estados para el grupo TODOS', () => {
    expect(estadosDeGrupo('TODOS')).toEqual([]);
  });

  it('muestra "Sin asignar" cuando no hay auditores', () => {
    const columna = columnasFormulacion.find((c) => c.columnDef === 'auditores_plan')!;
    expect(columna.cell({ auditores_plan: [] } as any)).toBe('Sin asignar');
    expect(columna.cell({ auditores_plan: ['Ana', 'Luis'] } as any)).toBe('Ana, Luis');
  });

  it('usa singular solo cuando el conteo es 1', () => {
    const pipe = new I18nPluralPipe(new NgLocaleLocalization('en-US'));
    expect(pipe.transform(1, pluralObservaciones)).toBe('1 Observación del Auditor');
    expect(pipe.transform(2, pluralObservaciones)).toBe('2 Observaciones del Auditor');
    expect(pipe.transform(1, pluralHallazgos)).toBe('1 Hallazgo detectado');
    expect(pipe.transform(0, pluralHallazgos)).toBe('0 Hallazgos detectados');
  });
});
