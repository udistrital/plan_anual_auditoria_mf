import { calcularFechaFinHabiles, contarDiasHabiles } from './dias-habiles.util';

describe('dias-habiles.util', () => {
  describe('contarDiasHabiles', () => {
    it('no cuenta el día inicial ni los fines de semana', () => {
      // Viernes 7 de febrero de 2025 → lunes 10 de febrero de 2025
      expect(contarDiasHabiles(new Date(2025, 1, 7), new Date(2025, 1, 10))).toBe(1);
    });

    it('excluye festivos colombianos', () => {
      // Viernes 14 de marzo → martes 25 de marzo de 2025 (lunes 24 es festivo de San José)
      expect(contarDiasHabiles(new Date(2025, 2, 14), new Date(2025, 2, 25))).toBe(6);
    });

    it('devuelve 0 para la misma fecha y negativo si la fecha final es anterior', () => {
      const lunes = new Date(2025, 1, 10);
      expect(contarDiasHabiles(lunes, lunes)).toBe(0);
      expect(contarDiasHabiles(new Date(2025, 1, 12), lunes)).toBe(-2);
    });

    it('es consistente con calcularFechaFinHabiles', () => {
      const desde = new Date(2025, 1, 12);
      expect(contarDiasHabiles(desde, calcularFechaFinHabiles(desde, 3))).toBe(3);
    });
  });
});
