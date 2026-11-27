import { formatearFechaCalendario, parsearFechaCalendario } from './fecha-calendario.util';

describe('fecha-calendario.util', () => {
  const esDia = (fecha: Date | null, anio: number, mes: number, dia: number) => {
    expect(fecha).not.toBeNull();
    expect(fecha!.getFullYear()).toBe(anio);
    expect(fecha!.getMonth()).toBe(mes);
    expect(fecha!.getDate()).toBe(dia);
    expect(fecha!.getHours()).toBe(0);
  };

  describe('parsearFechaCalendario', () => {
    it('medianoche UTC (cargue masivo) conserva el día', () => {
      esDia(parsearFechaCalendario('2026-11-26T00:00:00Z'), 2026, 10, 26);
    });

    it('medianoche de Colombia en UTC (formularios) conserva el día', () => {
      esDia(parsearFechaCalendario('2026-11-26T05:00:00.000Z'), 2026, 10, 26);
    });

    it('texto con desfase explícito conserva el día', () => {
      esDia(parsearFechaCalendario('2026-11-26T00:00:00-05:00'), 2026, 10, 26);
    });

    it('texto solo con la fecha conserva el día', () => {
      esDia(parsearFechaCalendario('2026-11-26'), 2026, 10, 26);
    });

    it('un Date conserva su día local', () => {
      esDia(parsearFechaCalendario(new Date(2026, 10, 26, 21, 30)), 2026, 10, 26);
    });

    it('devuelve null con valores vacíos o inválidos', () => {
      expect(parsearFechaCalendario(null)).toBeNull();
      expect(parsearFechaCalendario(undefined)).toBeNull();
      expect(parsearFechaCalendario('')).toBeNull();
      expect(parsearFechaCalendario('no es fecha')).toBeNull();
    });
  });

  describe('formatearFechaCalendario', () => {
    it('formatea medianoche UTC sin restar un día', () => {
      expect(
        formatearFechaCalendario('2026-11-26T00:00:00Z', { day: '2-digit', month: '2-digit', year: 'numeric' })
      ).toBe('26/11/2026');
    });

    it('devuelve vacío sin fecha', () => {
      expect(formatearFechaCalendario(null)).toBe('');
    });
  });
});
