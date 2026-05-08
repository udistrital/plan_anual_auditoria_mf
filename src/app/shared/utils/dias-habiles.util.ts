import Holidays from 'date-holidays';

const hd = new Holidays('CO');

/** Devuelve true si la fecha es día hábil (no fin de semana ni festivo colombiano). */
export function esDiaHabil(fecha: Date): boolean {
  const dia = fecha.getDay();
  if (dia === 0 || dia === 6) return false;
  return !hd.isHoliday(fecha);
}

/**
 * Suma N días hábiles a una fecha base, excluyendo fines de semana
 * y festivos nacionales colombianos según date-holidays.
 * Usada para calcular fecha_limite de plan_mejoramiento (+8 días hábiles).
 */
export function sumarDiasHabiles(fechaBase: Date, dias: number): Date {
  const resultado = new Date(fechaBase);
  let contados = 0;
  while (contados < dias) {
    resultado.setDate(resultado.getDate() + 1);
    if (esDiaHabil(resultado)) contados++;
  }
  return resultado;
}
