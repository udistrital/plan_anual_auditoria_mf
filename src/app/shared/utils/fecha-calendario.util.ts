/**
 * Utilidades para fechas de calendario: días sin hora (inicio, fin, límite, emisión...).
 *
 * El backend guarda estas fechas como un instante UTC, pero no siempre de la misma forma:
 * - el cargue masivo las guarda a medianoche UTC:           "2026-11-26T00:00:00Z"
 * - los formularios las guardan a medianoche de Colombia:    "2026-11-26T05:00:00Z"
 *
 * Convertirlas con `new Date(texto)` y mostrarlas en hora local (UTC-5) hace que la
 * primera se vea como el día anterior (25/11/2026 a las 7:00 p. m.). Estas funciones toman
 * el día UTC del texto y lo devuelven como medianoche local, así ambas formas muestran el
 * mismo día.
 *
 * En plantillas, el equivalente es pasar la zona 'UTC' al pipe: `fecha | date:'dd/MM/yyyy':'UTC'`.
 *
 * No usar para marcas de tiempo (fecha_creacion, fecha_modificacion, fecha de un estado...),
 * que sí son instantes y deben verse en hora local.
 */

/**
 * Convierte una fecha de calendario a medianoche local.
 * - Texto (lo que llega del backend): se toma el día en UTC.
 * - Date (creada en el frontend, p. ej. por un datepicker): se conserva su día local.
 * Devuelve null si el valor está vacío o no es una fecha válida.
 */
export function parsearFechaCalendario(valor: Date | string | null | undefined): Date | null {
  if (valor === null || valor === undefined || valor === "") return null;

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Date(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
}

/**
 * Formatea una fecha de calendario en es-CO (por defecto "26/11/2026").
 * Devuelve '' si el valor está vacío o no es una fecha válida.
 */
export function formatearFechaCalendario(
  valor: Date | string | null | undefined,
  opciones?: Intl.DateTimeFormatOptions
): string {
  const fecha = parsearFechaCalendario(valor);
  return fecha ? fecha.toLocaleDateString("es-CO", opciones) : "";
}
