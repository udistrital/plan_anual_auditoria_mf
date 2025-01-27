// src/app/services/descarga.service.ts
import { Injectable } from '@angular/core';
import * as JSZip from 'jszip'; 
import { saveAs } from 'file-saver'; 
import { environment } from "src/environments/environment";


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
      const arrayBuffer = this.base64ToArrayBuffer(base64File);
      const blob = new Blob([arrayBuffer], { type: fileType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${this.obtenerExtencionMimeType(fileType)}`;
      link.target = '_blank';
      link.click();

      // Limpiar la URL temporal para liberar memoria.
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      throw error; 
    }
  }

  /**
   * Descarga múltiples archivos comprimidos en un archivo ZIP.
   * @param documentos - Array de documentos, cada uno con las propiedades:
   *                     - base64: contenido en Base64 del archivo.
   *                     - tipo_id: identificador del tipo de documento (opcional).
   * @param archivoZip - Nombre del archivo ZIP resultante.
   * @throws Error si ocurre algún problema durante el proceso de compresión o descarga.
   */
  async descargarMultiplesArchivos(documentos: any[], archivoZip: string): Promise<void> {
    const zip = new JSZip();

    // Define los IDs de tipos específicos.
    const tipoIdPAA = environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA;
    const tipoIdMatrizPublica = environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA;

    try {
      documentos.forEach((doc, index) => {
        let fileName = `documento_${index + 1}.pdf`;

        // Asignar nombres específicos según tipo_id.
        if (doc.tipo_id === tipoIdPAA) {
          fileName = `plan_anual_auditoria.pdf`;
        } else if (doc.tipo_id === tipoIdMatrizPublica) {
          fileName = `matriz_funcion_publica.pdf`;
        }

        zip.file(fileName, doc.base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, archivoZip);
    } catch (error) {
      console.error('Error al crear el archivo ZIP:', error);
      throw error;
    }
  }

  /**
   * Convierte una cadena en Base64 a un ArrayBuffer.
   * @param base64 - La cadena en formato Base64.
   * @returns Un ArrayBuffer representando el contenido binario del archivo.
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
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
}
