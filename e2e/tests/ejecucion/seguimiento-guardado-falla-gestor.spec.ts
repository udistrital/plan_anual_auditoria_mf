// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { InformeSeguimientoPage, SeguimientoInformesPage } from '../../pages/seguimiento-informes.page';
import { SEMILLA_SEGUIMIENTO as SEMILLA, VIGENCIA_SEMILLA } from './datos';
import { PNG_1PX, simularSubidaGestorFallida } from './gestor';

test('en seguimiento, si la imagen no se puede subir al gestor, el guardado lo informa y se queda en el paso 3', { tag: ['@ejecucion', '@auditor', '@simulado', '@lectura'] }, async ({ page }, testInfo) => {
  const seguimientos = new SeguimientoInformesPage(page);
  const informe = new InformeSeguimientoPage(page);
  const intentos = await simularSubidaGestorFallida(page);
  const postsTema: string[] = [];
  page.on('request', (r) => { if (r.method() === 'POST' && /\/plan_anual_auditoria_crud\/v1\/tema$/.test(new URL(r.url()).pathname)) postsTema.push(r.url()); });
  const nombre = 'TEMA CON IMAGEN E2E';

  await test.step(`el auditor abre el informe de "${SEMILLA.titulo}" y agrega un tema con imagen`, async () => {
    await seguimientos.abrir();
    await seguimientos.elegirVigencia(VIGENCIA_SEMILLA);
    const fila = seguimientos.filaSeguimiento(SEMILLA.titulo);
    await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
    await seguimientos.accion(fila, 'Editar Informe');
    await informe.esperarCarga();
    await informe.irAAspectos();
    await informe.agregarTemaConImagen(nombre, { name: 'evidencia.png', mimeType: 'image/png', buffer: Buffer.from(PNG_1PX, 'base64') });
  });

  await test.step('al "Guardar y Continuar", el modal dice qué tema no se guardó y por qué', async () => {
    await informe.guardarAspectos();
    const texto = await informe.textoAlerta();
    // La captura espera a que el modal termine su animación de entrada
    await expect.poll(() => informe.alerta.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    await testInfo.attach('modal de guardado con fallos (seguimiento)', { body: await page.screenshot(), contentType: 'image/png' });
    expect(texto).toContain('No se guardó todo');
    expect(texto).toContain(`Tema "${nombre}": no se pudo guardar la imagen de la descripción en el gestor documental`);
    expect(texto).not.toContain('Guardado exitoso');
    expect(intentos).toHaveLength(1);
    expect(postsTema).toEqual([]);
    await informe.confirmarAlerta();
  });

  await test.step('se queda en el paso 3 con el tema escrito', async () => {
    await expect(informe.pasoAspectos).toHaveAttribute('aria-selected', 'true');
    await expect(informe.temas.last().getByLabel('Nombre del Tema')).toHaveValue(nombre);
  });
});
