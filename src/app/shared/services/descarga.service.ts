// src/app/services/descarga.service.ts
import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver'; 
import { environment } from "src/environments/environment";
import base64ToArrayBuffer from '../utils/base64ToArrayBuffer';

@Injectable({
  providedIn: 'root',
})
export class DescargaService {
  /**
   * Descarga un archivo individual basado en su contenido codificado en Base64.
   * @param base64File - El contenido del archivo en formato Base64.
   * @param fileType - El tipo MIME del archivo (ejemplo: 'application/pdf').
   * @param fileName - El nombre del archivo (sin extensión).
   * @throws Error si ocurre algún problema durante el proceso de descarga.
   */
  async descargarArchivo(base64File: string, fileType: string, fileName: string): Promise<void> {
    try {
      const arrayBuffer = base64ToArrayBuffer(base64File);
      const blob = new Blob([arrayBuffer], { type: fileType });
      this.descargarArchivoBlob(blob, fileType, fileName);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      throw error; 
    }
  }

  /**
   * Downloads an individual file based on its ArrayBuffer content.
   * @param buffer The ArrayBuffer content of the file.
   * @param fileType The MIME type of the file (e.g., 'application/pdf').
   * @param fileName The name of the file (without extension).
   * @throws Error if any issue occurs during the download process.
   */
  async descargarArchivoBuffer(buffer: ArrayBuffer, fileType: string, fileName: string): Promise<void> {
    try {
      const blob = new Blob([buffer], { type: fileType });
      this.descargarArchivoBlob(blob, fileType, fileName);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      throw error; 
    }
  }

  /**
   * Helper method to trigger the download of a Blob as a file.
   * @param blob The Blob representing the file content.
   * @param fileType The MIME type of the file.
   * @param fileName The name of the file (without extension).
   * @throws Error if any issue occurs during the download process.
   */
  private descargarArchivoBlob(blob: Blob, fileType: string, fileName: string): void {
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${this.obtenerExtencionMimeType(fileType)}`;
    link.target = '_blank';
    link.click();

    // Limpiar la URL temporal para liberar memoria.
    window.URL.revokeObjectURL(url);
  }

  /**
   * Descarga múltiples archivos comprimidos en un archivo ZIP.
   * @param documentos - Array de documentos, cada uno con las propiedades:
   *                     - base64: contenido en Base64 del archivo.
   *                     - tipo_id: identificador del tipo de documento (opcional).
   * @param nombre - Nombre del archivo ZIP resultante.
   * @param suffix - Sufijo opcional para agregar al nombre de los archivos dentro del ZIP (ejemplo: 2026).
   * @throws Error si ocurre algún problema durante el proceso de compresión o descarga.
   */
  async descargarMultiplesArchivos(
    documentos: any[],
    nombre: string,
    suffix?: string
  ): Promise<void> {
    const zip = new JSZip();
    const nombreBaseContador = new Map<string, number>();
    const suffixNormalizado = suffix ? `-${suffix.replace(/\s+/g, '-')}` : '';
  
    try {
      documentos.forEach((doc, index) => {
        const nombreBasePersonalizado = typeof doc.fileName === 'string'
          ? this.normalizarNombreArchivo(doc.fileName)
          : '';

        // Buscar la clave correspondiente al tipo_id en TIPO_DOCUMENTO_PARAMETROS
        const tipoDocumento = Object.entries(environment.TIPO_DOCUMENTO_PARAMETROS)
          .find(([_, id]) => id === doc.tipo_id)?.[0];

        // Asignar un nombre adecuado al archivo
        let nombreBase: string;

        if (nombreBasePersonalizado) {
          nombreBase = `${nombreBasePersonalizado}${suffixNormalizado}`;
        } else if (tipoDocumento) {
          nombreBase = `${tipoDocumento.toLowerCase().replaceAll('_', '-')}${suffixNormalizado}`;
        } else {
          nombreBase = `documento_${index + 1}${suffixNormalizado}`;
        }

        const ocurrencias = (nombreBaseContador.get(nombreBase) ?? 0) + 1;
        nombreBaseContador.set(nombreBase, ocurrencias);

        const fileName = ocurrencias > 1
          ? `${nombreBase}-${ocurrencias}.pdf`
          : `${nombreBase}.pdf`;
  
        zip.file(fileName, doc.base64, { base64: true });
      });
  
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, nombre);
    } catch (error) {
      console.error('Error al crear el archivo ZIP:', error);
      throw error;
    }
  }

  /**
   * Obtiene la extensión de archivo correspondiente a un tipo MIME.
   * @param mimeType - El tipo MIME del archivo (ejemplo: 'application/pdf').
   * @returns La extensión de archivo asociada (ejemplo: 'pdf').
   */
  private obtenerExtencionMimeType(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt',
      'application/json': 'json',
    };
    return mimeMap[mimeType] || 'file';
  }

  private normalizarNombreArchivo(nombre: string): string {
    return nombre
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-)|(-$)/g, '');
  }
}
