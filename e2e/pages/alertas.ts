/**
 * Alertas SweetAlert2 de los clientes OAS en los flujos que escriben: una acción puede encadenar
 * una confirmación ("¿Está seguro…?"), una espera (firma, generación de PDF) y el resultado.
 */
import { expect, type Page } from '@playwright/test';

/**
 * Atiende las alertas que dispara una acción hasta el resultado: confirma las preguntas (las que
 * tienen botón de cancelar), falla de inmediato si la aplicación muestra un error y cierra el aviso
 * final. Devuelve el texto de cada alerta, en orden.
 *
 * `hasta`: texto del aviso final cuando la aplicación encadena varios avisos de éxito (p. ej. el
 * secretario: "Archivo subido exitosamente." y, al cerrarlo, genera las auditorías y avisa "Plan
 * aprobado exitosamente."). Sin `hasta`, termina en el primer aviso que no es pregunta.
 */
export async function resolverAlertas(
  page: Page,
  { timeout = 180_000, maxPreguntas = 3, hasta }: { timeout?: number; maxPreguntas?: number; hasta?: RegExp } = {},
): Promise<string[]> {
  const alerta = page.locator('.swal2-popup');
  const textos: string[] = [];
  for (let i = 0; i <= maxPreguntas + 3; i++) {
    await expect(alerta).toBeVisible({ timeout });
    // Las alertas de carga muestran "Aceptar" deshabilitado (o sin botones) hasta que la operación
    // termina y se reemplazan solas: se espera a un botón visible y habilitado.
    const boton = alerta.locator('.swal2-confirm:not([disabled]), .swal2-cancel:not([disabled])').filter({ visible: true }).first();
    await expect(boton).toBeVisible({ timeout });
    await expect(alerta.locator('.swal2-loader')).toBeHidden({ timeout });
    const texto = (await alerta.innerText()).replace(/\s+/g, ' ').trim();
    textos.push(texto);
    if (await alerta.locator('.swal2-icon-error').isVisible()) {
      throw new Error(`la aplicación respondió con un error: "${texto}"`);
    }
    const esPregunta = await alerta.locator('.swal2-cancel').isVisible();
    await alerta.locator('.swal2-confirm').click();
    if (!esPregunta && (!hasta || hasta.test(texto))) {
      await expect(alerta).toBeHidden();
      return textos;
    }
  }
  throw new Error(`demasiadas alertas seguidas sin llegar al resultado: ${textos.join(' | ')}`);
}
