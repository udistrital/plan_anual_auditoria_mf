/**
 * Convierte una cadena en Base64 a un ArrayBuffer.
 * @param base64 - La cadena en formato Base64.
 * @returns Un ArrayBuffer representando el contenido binario del archivo.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default base64ToArrayBuffer;
