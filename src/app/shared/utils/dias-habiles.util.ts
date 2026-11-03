import Holidays from 'date-holidays';

const hd = new Holidays('CO');
const festivosCache: Record<number, Set<string>> = {};

function getFestivosDelAnio(anio: number): Set<string> {
  if (!festivosCache[anio]) {
    festivosCache[anio] = new Set(
      hd.getHolidays(anio)
        .filter(h => h.type === 'public')
        .map(h => h.date.substring(0, 10))
    );
  }
  return festivosCache[anio];
}

function toKey(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

/** Devuelve true si la fecha es día hábil (no fin de semana ni festivo público colombiano). */
export function esDiaHabil(fecha: Date): boolean {
  const dia = fecha.getDay();
  if (dia === 0 || dia === 6) return false;
  return !getFestivosDelAnio(fecha.getFullYear()).has(toKey(fecha));
}

/**
 * Suma N días hábiles a una fecha base, excluyendo fines de semana
 * y festivos públicos colombianos. El día base NO cuenta — el conteo
 * empieza desde el día siguiente.
 * Usada para calcular fecha_limite de plan_mejoramiento (+8 días hábiles)
 * y fechaInicio de acciones de mejora.
 */
export function sumarDiasHabiles(fechaBase: Date, dias: number): Date {
  const resultado = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate());
  let contados = 0;
  while (contados < dias) {
    resultado.setDate(resultado.getDate() + 1);
    if (esDiaHabil(resultado)) contados++;
  }
  return resultado;
}

/**
 * Suma N días hábiles a una fecha base donde el día base SÍ cuenta como día 1
 * (salvo que sea festivo). Misma lógica que revision-documentos en ejecución.
 * Usada para calcular plazos de revisión de informes.
 */
export function calcularFechaFinHabiles(desde: Date, dias: number): Date {
  const result = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const startYear = result.getFullYear();
  let count = getFestivosDelAnio(startYear).has(toKey(result)) ? 0 : 1;

  while (count < dias + 1) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow === 0 || dow === 6) continue;
    if (!getFestivosDelAnio(result.getFullYear()).has(toKey(result))) count++;
  }

  return result;
}

/**
 * Cuenta los días hábiles después de `desde` hasta `hasta` inclusive (el día `desde` NO cuenta).
 * Devuelve un número negativo si `hasta` es anterior a `desde`.
 */
export function contarDiasHabiles(desde: Date, hasta: Date): number {
  const inicio = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  const signo = fin < inicio ? -1 : 1;
  const [menor, mayor] = signo === 1 ? [inicio, fin] : [fin, inicio];

  let dias = 0;
  const actual = new Date(menor);
  while (actual < mayor) {
    actual.setDate(actual.getDate() + 1);
    if (esDiaHabil(actual)) dias++;
  }
  return signo * dias;
}
