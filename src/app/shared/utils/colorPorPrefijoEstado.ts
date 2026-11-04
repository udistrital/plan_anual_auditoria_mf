/**
 * Mapping for emoji colors icons based on state prefixes.
 *
 * Values:
 * - Yellow Circle 🟡 : estados en edición/borrador o en formulación
 * - Blue Circle 🔵   : estados en revisión
 * - Green Circle 🟢  : estados aprobados o finalizados
 * - Red Circle 🔴    : estados rechazados o devueltos
 *
 * Los prefijos se evalúan por `startsWith` sobre el nombre del estado, por lo que
 * cubren los nombres de todas las fases (Programación, Planeación, Ejecución y
 * Plan de Mejoramiento).
 */
export const emojiColorPorPrefijoEstado: { [prefijo: string]: string } = {
  "Borrador": "🟡",
  "En formulación": "🟡",
  "En Revisión": "🔵",
  "En revisión": "🔵",
  "Aprobado": "🟢",
  "Aprobada": "🟢",
  "Finalizado": "🟢",
  "Rechazado": "🔴",
  "Rechazada": "🔴",
  "Devuelto": "🔴",
};

export default emojiColorPorPrefijoEstado;
