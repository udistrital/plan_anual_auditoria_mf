/**
 * Indica si un HTML generado por Quill no tiene contenido visible
 * (p. ej. `<p><br></p>`, espacios o `&nbsp;`). Se considera con contenido
 * si incluye imágenes o tablas aunque no tenga texto.
 *
 * Debe mantenerse en sync con el util homónimo del MID
 * (`plan_anual_auditoria_mid/src/shared/utils/html.util.ts`).
 */
export function esHtmlVacio(html: string | null | undefined): boolean {
  if (!html) return true;
  if (/<(img|table|iframe)\b/i.test(html)) return false;
  const texto = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .trim();
  return texto.length === 0;
}

const PREFIJO_ENLACE_NUXEO = 'NuxeoEnlace';

/** Texto que reemplaza a una descripción con imágenes en tablas, listados y exportaciones. */
export const TEXTO_CONTENIDO_CON_IMAGENES = '(Contenido con imágenes)';

/** Las descripciones de Quill siempre inician con una etiqueta de bloque; las anteriores son texto plano. */
const INICIO_HTML = /^\s*<(p|ol|ul|h[1-6]|blockquote|pre|div)\b/i;

export function esEnlaceNuxeo(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.startsWith(PREFIJO_ENLACE_NUXEO);
}

export function esHtml(valor: string | null | undefined): boolean {
  return !!valor && INICIO_HTML.test(valor);
}

export function contieneImagen(html: string | null | undefined): boolean {
  return /<img\b/i.test(html ?? '');
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Convierte texto plano en párrafos HTML, conservando sus saltos de línea.
 *
 * Debe mantenerse en sync con el util homónimo del MID
 * (`plan_anual_auditoria_mid/src/shared/utils/html.util.ts`).
 */
export function textoPlanoAHtml(texto: string | null | undefined): string {
  const limpio = (texto ?? '').trim();
  if (!limpio) return '';
  return limpio
    .split(/\r?\n/)
    .map((linea) => (linea.trim() ? `<p>${escaparHtml(linea)}</p>` : '<p><br></p>'))
    .join('');
}

/** Extrae el texto de un HTML. Usa DOMParser, que no carga imágenes ni ejecuta su contenido. */
export function htmlATexto(html: string | null | undefined): string {
  if (!html) return '';
  const conSaltos = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h[1-6]|blockquote|pre|div)>/gi, '\n');
  const documento = new DOMParser().parseFromString(conSaltos, 'text/html');
  return (documento.body.textContent ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** Versión en texto de una descripción para tablas y exportaciones. Nunca consulta el gestor documental. */
export function descripcionATexto(valor: string | null | undefined): string {
  if (!valor) return '';
  if (esEnlaceNuxeo(valor)) return TEXTO_CONTENIDO_CON_IMAGENES;
  if (!esHtml(valor)) return valor;
  const texto = htmlATexto(valor);
  return texto || (contieneImagen(valor) ? TEXTO_CONTENIDO_CON_IMAGENES : '');
}

/** El gestor documental devuelve el HTML codificado en base64 (UTF-8). */
function decodificarHtmlBase64(contenido: string): string {
  const bytes = Uint8Array.from(atob(contenido), (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

/** Pasa el ancho de las imágenes a un atributo, porque el sanitizador de Angular elimina `style`. */
function anchoImagenAAtributo(html: string): string {
  return html.replace(/style="width:\s*(\d+)px;?"/g, 'width="$1px"');
}

/**
 * Deja en HTML una descripción guardada, sea cual sea su formato (texto plano, HTML o enlace de Nuxeo).
 * Si el gestor documental falla, el error llega a quien la consulta.
 */
export async function descripcionAHtml(
  valor: string | null | undefined,
  obtenerDocumento: (uuid: string) => Promise<string>,
): Promise<string> {
  if (!valor) return '';
  if (esEnlaceNuxeo(valor)) {
    const uuid = valor.substring(valor.indexOf(':') + 1);
    return anchoImagenAAtributo(decodificarHtmlBase64(await obtenerDocumento(uuid)));
  }
  return esHtml(valor) ? valor : textoPlanoAHtml(valor);
}
