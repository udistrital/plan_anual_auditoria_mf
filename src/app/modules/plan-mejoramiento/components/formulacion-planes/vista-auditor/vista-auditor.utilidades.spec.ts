import { environment } from 'src/environments/environment';
import { calcularPlazo, columnasAuditor, estadosDeGrupo, grupoDeEstado, indicadoresAuditor } from './vista-auditor.utilidades';

const ESTADO = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;

const fila = (estadoId: number, fechaEstado: string | null) => ({
  estado_plan_id: estadoId,
  fecha_estado: fechaEstado,
}) as any;

describe('vista-auditor.utilidades', () => {
  it('separa los planes rechazados como "con observaciones"', () => {
    expect(grupoDeEstado(ESTADO.SIN_PLAN_MEJORAMIENTO)).toBe('SIN_FORMULAR');
    expect(grupoDeEstado(ESTADO.CREANDO_PLAN_MEJORAMIENTO)).toBe('EN_FORMULACION');
    expect(grupoDeEstado(ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR)).toBe('EN_REVISION');
    expect(grupoDeEstado(ESTADO.RECHAZADO_PLAN_MEJORAMIENTO)).toBe('CON_OBSERVACIONES');
    expect(grupoDeEstado(ESTADO.APROBADO_PLAN_MEJORAMIENTO)).toBe('APROBADOS');
    expect(grupoDeEstado(ESTADO.FIN_PLAN_MEJORAMIENTO)).toBe('APROBADOS');
    expect(estadosDeGrupo('TODOS')).toEqual([]);
  });

  it('la tarjeta "En formulación" suma los planes sin formular y en formulación', () => {
    const enFormulacion = indicadoresAuditor.find((i) => i.titulo === 'En formulación')!;
    expect(enFormulacion.valor({ sin_formular: 2, en_formulacion: 3 } as any)).toBe(5);
  });

  describe('calcularPlazo', () => {
    // Revisión radicada el miércoles 12/02/2025: vence 3 días hábiles después (lunes 17/02)
    const radicado = '2025-02-12T10:00:00';

    it('cuenta los días hábiles que le quedan a la revisión del auditor', () => {
      expect(calcularPlazo(fila(ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR, radicado), new Date(2025, 1, 13))).toEqual({
        fecha: 'Rad: 12/02/2025',
        detalle: '2 días hábiles restantes',
        icono: 'timer',
        clase: 'plazo-vigente',
      });
      expect(calcularPlazo(fila(ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR, radicado), new Date(2025, 1, 14))?.detalle)
        .toBe('1 día hábil restante');
    });

    it('marca el plazo vencido o que vence hoy', () => {
      expect(calcularPlazo(fila(ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR, radicado), new Date(2025, 1, 17))?.detalle).toBe('Vence hoy');
      expect(calcularPlazo(fila(ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR, radicado), new Date(2025, 1, 19))).toMatchObject({
        detalle: 'Vencido hace 2 días hábiles',
        clase: 'plazo-vencido',
      });
    });

    it('usa el plazo de formulación para los ajustes de un plan rechazado', () => {
      const plazo = calcularPlazo(fila(ESTADO.RECHAZADO_PLAN_MEJORAMIENTO, '2025-02-10T10:00:00'), new Date(2025, 1, 11));
      expect(plazo).toMatchObject({ fecha: 'Devuelto: 10/02/2025', detalle: `Vence: ${environment.DIAS_FORMULACION_PLAN - 1} días hábiles (ajustes)` });
    });

    it('muestra la fecha de aprobación y no aplica plazo sin fecha o en formulación', () => {
      expect(calcularPlazo(fila(ESTADO.APROBADO_PLAN_MEJORAMIENTO, '2025-02-05T10:00:00'))).toMatchObject({
        fecha: 'Aprobado: 05/02/2025',
        clase: 'plazo-cumplido',
      });
      expect(calcularPlazo(fila(ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR, null))).toBeNull();
      expect(calcularPlazo(fila(ESTADO.CREANDO_PLAN_MEJORAMIENTO, radicado))).toBeNull();
    });
  });

  it('exporta la columna de plazo como texto', () => {
    const columna = columnasAuditor.find((c) => c.columnDef === 'plazo')!;
    expect(columna.cell(fila(ESTADO.APROBADO_PLAN_MEJORAMIENTO, '2025-02-05T10:00:00'))).toBe('Aprobado: 05/02/2025 · Dictamen formal emitido');
    expect(columna.cell(fila(ESTADO.SIN_PLAN_MEJORAMIENTO, null))).toBe('');
  });
});
