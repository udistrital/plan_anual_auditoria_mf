/**
 * Mapping for emoji colors icons based on state prefixes.
 * 
 * Values:
 * - "Borrador": Yellow Circle 🟡
 * - "En Revisión": Blue Circle 🔵
 * - "Aprobado": Green Circle 🟢
 * - "Rechazado": Red Circle 🔴
 */
export const emojiColorPorPrefijoEstado: { [prefijo: string]: string } = {
  "Borrador": "🟡",
  "En Revisión": "🔵",
  "Aprobado": "🟢",
  "Rechazado": "🔴",
};

export default emojiColorPorPrefijoEstado;
