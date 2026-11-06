/**
 * Simulación del gestor documental (GET gestor_documental_mid/v1/document/:uid) para los escenarios de
 * descripciones con imagen (F4 de #940). No escribe: sólo responde la descarga que hace el MF.
 */
import zlib from 'node:zlib';
import { type Page } from '@playwright/test';

/**
 * PNG en base64 del tamaño pedido, con píxeles de un patrón pseudoaleatorio fijo (no se comprime). Con un
 * tamaño poco común (p. ej. 37×23) se reconoce la imagen en el PDF generado por sus dimensiones, sin
 * confundirla con los logos de la plantilla. Que no se comprima importa: el gestor documental rechaza con
 * 400 "invalid pdf file" todo archivo cuyo base64 tenga menos de 1000 caracteres (gestor_documental_mid,
 * controllers/document.py → postAny), sea del formato que sea.
 */
export function pngPatron(ancho: number, alto: number): string {
  let semilla = 940;
  const byte = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) >>> 16) & 255; // bits altos: sin periodo corto
  const filas = Array.from({ length: alto }, () => Buffer.from([0, ...Array.from({ length: ancho * 3 }, byte)]));
  return png(ancho, alto, Buffer.concat(filas));
}

function png(ancho: number, alto: number, pixelesRgb: Buffer): string {
  const bloque = (tipo: string, datos: Buffer) => {
    const largo = Buffer.alloc(4);
    largo.writeUInt32BE(datos.length);
    const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(cuerpo));
    return Buffer.concat([largo, cuerpo, crc]);
  };
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(ancho, 0);
  cabecera.writeUInt32BE(alto, 4);
  cabecera.set([8, 2, 0, 0, 0], 8); // 8 bits por canal, RGB, sin entrelazado
  const pixeles = zlib.deflateSync(pixelesRgb); // cada fila empieza con su byte de filtro (0)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque('IHDR', cabecera),
    bloque('IDAT', pixeles),
    bloque('IEND', Buffer.alloc(0)),
  ]).toString('base64');
}

/** Imágenes del PDF (XObject /Image) con sus dimensiones, leídas de los diccionarios sin comprimir. */
export function imagenesDelPdf(pdf: Buffer): { ancho: number; alto: number }[] {
  const texto = pdf.toString('latin1');
  const imagenes: { ancho: number; alto: number }[] = [];
  for (const [dic] of texto.matchAll(/<<(?:(?!>>)[\s\S]){0,600}\/Subtype\s*\/Image[\s\S]{0,600}?>>/g)) {
    const ancho = Number(/\/Width\s+(\d+)/.exec(dic)?.[1]);
    const alto = Number(/\/Height\s+(\d+)/.exec(dic)?.[1]);
    if (ancho && alto) imagenes.push({ ancho, alto });
  }
  return imagenes;
}

const DESCARGA = /\/gestor_documental_mid\/v1\/document\/[0-9a-f-]{36}$/;

/** PNG de 1×1 px, para una imagen embebida válida. */
export const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** HTML de una descripción de tema con texto e imagen, como lo guarda el MF en Nuxeo. */
export const HTML_DESCRIPCION_CON_IMAGEN =
  `<p>Evidencia fotográfica del hallazgo (semilla E2E).</p><p><img src="data:image/png;base64,${PNG_1PX}" style="width:300px;"></p>`;

/**
 * Responde como WSO2 hoy (C1): 404 "No matching resource" y sin cabeceras CORS, de modo que el navegador
 * ve la misma falla de red que en el ambiente. Devuelve las descargas atendidas.
 */
export async function simularGestorCaido(page: Page): Promise<string[]> {
  const atendidas: string[] = [];
  await page.route((url) => DESCARGA.test(url.pathname), (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    atendidas.push(new URL(route.request().url()).pathname);
    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ fault: { code: 404, message: 'Runtime Error', description: 'No matching resource found for given API Request' } }),
    });
  });
  return atendidas;
}

/**
 * Responde la subida al gestor (POST document/uploadAnyFormat) con el enlace indicado, sin escribir en el
 * ambiente. Se registra en la página, así que tiene prioridad sobre el bloqueo de escrituras del contexto.
 * Devuelve los documentos recibidos (decodificados) para verificar qué se subió.
 */
export async function simularSubidaGestor(page: Page, enlace: string): Promise<{ nombre: string; html: string }[]> {
  const recibidos: { nombre: string; html: string }[] = [];
  await page.route((url) => /\/gestor_documental_mid\/v1\/document\/uploadAnyFormat$/.test(url.pathname), (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    for (const doc of route.request().postDataJSON() ?? []) {
      // El MF envía el HTML en base64 y, además, serializado como JSON (JSON.stringify del base64)
      const base64 = String(doc.file).replace(/^"|"$/g, '');
      recibidos.push({ nombre: doc.nombre, html: Buffer.from(base64, 'base64').toString('utf8') });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ Status: '200', res: { Enlace: enlace } }),
    });
  });
  return recibidos;
}

/**
 * La subida al gestor falla como el 03/11 (C1): 404 de WSO2 sin cabeceras CORS, de modo que el navegador
 * ve la misma falla de red. Devuelve los intentos de subida.
 */
export async function simularSubidaGestorFallida(page: Page): Promise<string[]> {
  const intentos: string[] = [];
  await page.route((url) => /\/gestor_documental_mid\/v1\/document\/uploadAnyFormat$/.test(url.pathname), (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    intentos.push(new URL(route.request().url()).pathname);
    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ fault: { code: 404, message: 'Runtime Error', description: 'No matching resource found for given API Request' } }),
    });
  });
  return intentos;
}

/** Responde la descarga con el HTML indicado (en base64, campo `file`, como el gestor). */
export async function simularGestorConDocumento(page: Page, html: string): Promise<string[]> {
  const atendidas: string[] = [];
  await page.route((url) => DESCARGA.test(url.pathname), (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    atendidas.push(new URL(route.request().url()).pathname);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ file: Buffer.from(html, 'utf8').toString('base64') }),
    });
  });
  return atendidas;
}
