/**
 * Registro de auditorías externas (#953).
 *
 * Todo el registro vive en memoria del MF hasta que el auditor pulsa Continuar;
 * entonces se envía completo al MID. Las reglas de este archivo deben mantenerse
 * alineadas con `validar-hallazgo-externo.util.ts` del MID (que revalida todo).
 */

/** Máximo de hallazgos por registro (mismo límite del MID). */
export const MAX_HALLAZGOS_EXTERNOS = 500;

export interface HallazgoExterno {
  vigencia_pad: number;
  vigencia_nombre: string;
  codigo_auditoria_pad: string;
  numeral: string;
  /** Descripción corta: hace de título y de descripción del hallazgo. */
  descripcion: string;
  dependencia_id: number[];
  dependencias_nombre: string[];
}

/** PDF del informe final elegido por el auditor; aún no se sube a Nuxeo. */
export interface InformeFinalLocal {
  nombre: string;
  base64: string;
  tamanio: number;
}

export interface DatosGeneralesAuditoriaExterna {
  codigo_entidad: string;
  nombre_entidad: string;
  nombre_auditoria: string;
  /** Fecha ISO de emisión del informe final. */
  fecha_informe_final: string;
  vigencia_id: number;
}

export interface RegistroAuditoriaExterna {
  datosGenerales: DatosGeneralesAuditoriaExterna | null;
  hallazgos: HallazgoExterno[];
  informeFinal: InformeFinalLocal | null;
}

type ClaveHallazgo = Pick<HallazgoExterno, 'codigo_auditoria_pad' | 'numeral'>;

/** Clave de unicidad: código de auditoría + número de hallazgo, sin distinguir mayúsculas. */
export function claveHallazgoExterno(hallazgo: ClaveHallazgo): string {
  const codigo = (hallazgo.codigo_auditoria_pad ?? '').trim().toLowerCase();
  const numeral = (hallazgo.numeral ?? '').trim().toLowerCase();
  return `${codigo}|${numeral}`;
}

/**
 * Índice (base 0) del primer hallazgo de la lista con la misma clave que el
 * candidato, o -1. `ignorarIndice` permite editar un hallazgo sin chocar consigo mismo.
 */
export function buscarHallazgoDuplicado(
  lista: ClaveHallazgo[],
  candidato: ClaveHallazgo,
  ignorarIndice: number | null = null,
): number {
  const clave = claveHallazgoExterno(candidato);
  return lista.findIndex(
    (h, i) => i !== ignorarIndice && claveHallazgoExterno(h) === clave,
  );
}

/** Año de una fecha (Date o texto ISO); null si no es una fecha válida. */
export function anioDeFecha(valor: Date | string | null | undefined): number | null {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.getFullYear();
}

/**
 * Lo que falta para poder pulsar Continuar. Lista vacía = el registro está completo:
 * datos generales, PDF y al menos un hallazgo (el MID vuelve a validar todo).
 */
export function pendientesParaContinuar(registro: RegistroAuditoriaExterna): string[] {
  const pendientes: string[] = [];
  if (!registro.datosGenerales) {
    pendientes.push('Complete y guarde la información general de la auditoría.');
  }
  if (!registro.hallazgos.length) {
    pendientes.push('Registre al menos un hallazgo.');
  }
  if (!registro.informeFinal) {
    pendientes.push('Adjunte el informe final en formato PDF.');
  }
  return pendientes;
}
