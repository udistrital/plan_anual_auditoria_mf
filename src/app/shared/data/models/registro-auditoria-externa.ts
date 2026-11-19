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

/** Error de un archivo de cargue masivo, tal como lo reporta el MID. */
export interface ErrorCargueHallazgo {
  /** Fila del archivo (la 1 es el encabezado); 0 si afecta a todo el archivo. */
  fila: number;
  columna: string;
  motivo: string;
}

/** Hallazgo validado por el MID: trae además la fila del archivo de donde salió. */
export type HallazgoCargado = HallazgoExterno & { fila?: number };

/**
 * Suma los hallazgos de un archivo ya validado a los que el auditor tiene registrados.
 * Todo o nada: si alguno repite código + número de un hallazgo existente, o se supera
 * el máximo, no se agrega ninguno y se devuelven los errores.
 */
export function combinarHallazgos(
  existentes: HallazgoExterno[],
  cargados: HallazgoCargado[],
  maximo: number = MAX_HALLAZGOS_EXTERNOS,
): { hallazgos: HallazgoExterno[]; errores: ErrorCargueHallazgo[] } {
  const errores: ErrorCargueHallazgo[] = [];

  if (existentes.length + cargados.length > maximo) {
    errores.push({
      fila: 0,
      columna: 'Archivo',
      motivo: `Ya hay ${existentes.length} hallazgos registrados y el archivo trae ${cargados.length}: el máximo es ${maximo}.`,
    });
  }

  cargados.forEach((cargado, indice) => {
    const posicion = buscarHallazgoDuplicado(existentes, cargado);
    if (posicion >= 0) {
      errores.push({
        fila: cargado.fila ?? indice + 2,
        columna: 'No. Hallazgo',
        motivo: `El hallazgo "${cargado.numeral}" de la auditoría "${cargado.codigo_auditoria_pad}" ya está registrado (hallazgo ${posicion + 1} de la lista).`,
      });
    }
  });

  if (errores.length) return { hallazgos: existentes, errores };

  const nuevos = cargados.map(({ fila: _fila, ...hallazgo }) => hallazgo);
  return { hallazgos: [...existentes, ...nuevos], errores: [] };
}

/**
 * Lee el error de una llamada de cargue al MID. El filtro de errores del MID entrega
 * `{ status, message, details: { errores } }`, que el cliente HTTP deja en `error.error`.
 */
export function extraerErroresCargue(error: any): {
  mensaje: string;
  errores: ErrorCargueHallazgo[];
} {
  const cuerpo = error?.error;
  const errores: ErrorCargueHallazgo[] = Array.isArray(cuerpo?.details?.errores)
    ? cuerpo.details.errores
    : [];
  const texto = Array.isArray(cuerpo?.message) ? cuerpo.message.join(' ') : cuerpo?.message;
  const mensaje =
    typeof texto === 'string' && texto.trim()
      ? texto
      : 'No fue posible validar el archivo. Intente de nuevo.';
  return { mensaje, errores };
}

/**
 * Mensajes para el auditor cuando el MID rechaza el registro: uno por error de validación
 * (con el número de hallazgo cuando aplica) o uno solo para 403, 409, 502 y fallos de red.
 */
export function mensajesErrorRegistro(error: any): string[] {
  const cuerpo = error?.error;
  const estado = error?.status ?? cuerpo?.status;
  const texto = Array.isArray(cuerpo?.message) ? cuerpo.message.join(' ') : cuerpo?.message;
  const errores: { fila: number; motivo: string }[] = Array.isArray(cuerpo?.details?.errores)
    ? cuerpo.details.errores
    : [];

  if (estado === 400 && errores.length) {
    return errores.map((e) => (e.fila > 0 ? `Hallazgo ${e.fila}: ${e.motivo}` : e.motivo));
  }
  if (estado === 403) return ['Su rol no permite registrar auditorías externas.'];
  if (estado === 409 && typeof texto === 'string') return [texto];
  if (estado === 502) {
    return ['No fue posible guardar el registro; no se guardó nada. Intente de nuevo en unos minutos.'];
  }
  return ['No fue posible registrar la auditoría externa. Intente de nuevo.'];
}

/** Año de una fecha (Date o texto ISO); null si no es una fecha válida. */
export function anioDeFecha(valor: Date | string | null | undefined): number | null {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.getFullYear();
}

export type SeccionRegistro = 'informacion' | 'informe' | 'hallazgos';

export interface PendienteRegistro {
  seccion: SeccionRegistro;
  mensaje: string;
}

/**
 * Lo que falta para poder pulsar Continuar. Lista vacía = el registro está completo:
 * datos generales, PDF y al menos un hallazgo (el MID vuelve a validar todo).
 */
export function pendientesParaContinuar(registro: RegistroAuditoriaExterna): PendienteRegistro[] {
  const pendientes: PendienteRegistro[] = [];
  if (!registro.datosGenerales) {
    pendientes.push({ seccion: 'informacion', mensaje: 'Complete la información general de la auditoría.' });
  }
  if (!registro.informeFinal) {
    pendientes.push({ seccion: 'informe', mensaje: 'Adjunte el informe final en formato PDF.' });
  }
  if (!registro.hallazgos.length) {
    pendientes.push({ seccion: 'hallazgos', mensaje: 'Registre al menos un hallazgo.' });
  }
  return pendientes;
}

/** Cuerpo que recibe `POST /auditoria-externa` del MID. */
export function armarCuerpoRegistro(
  registro: RegistroAuditoriaExterna,
  documento: { nuxeo_id: number; nuxeo_enlace: string },
  usuario: { id: number; rol: string },
) {
  const datos = registro.datosGenerales!;
  return {
    codigo_entidad: datos.codigo_entidad,
    nombre_entidad: datos.nombre_entidad,
    nombre_auditoria: datos.nombre_auditoria,
    fecha_informe_final: datos.fecha_informe_final,
    vigencia_id: datos.vigencia_id,
    hallazgos: registro.hallazgos.map((h) => ({
      vigencia_pad: h.vigencia_pad,
      codigo_auditoria_pad: h.codigo_auditoria_pad,
      numeral: h.numeral,
      descripcion: h.descripcion,
      dependencia_id: h.dependencia_id,
    })),
    documento,
    usuario_id: usuario.id,
    usuario_rol: usuario.rol,
  };
}
