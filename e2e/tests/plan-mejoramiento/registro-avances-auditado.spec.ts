// spec: e2e/specs/registro-avances.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

test('el auditado consulta el registro de avances de una acción', { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  // Acción que carga la vista (accion-mejora?query=_id:…): de ella sale la causa de la ficha (#947)
  const respuestaAccion = page.waitForResponse(
    (r) => r.request().method() === 'GET' && /\/accion-mejora\?query=_id:/.test(decodeURIComponent(r.url())),
    { timeout: 120_000 },
  );
  const registro = await test.step('entra desde Gestión de acciones a una acción de la que es responsable', () => abrirAccion(page, 'registrar-avances'));
  const accion = (await (await respuestaAccion).json())?.Data?.[0] ?? {};

  await test.step('ve la variante del auditado', async () => {
    await expect(registro.tituloEvidencias).toHaveText('Evidencias de avance');
    await expect(registro.tituloCalificacion).toHaveText('Calificación de Control Interno');
    await expect(registro.formulario.raiz).toHaveCount(0);
    await expect(registro.botonCargue).toHaveCount(0);
    await expect(registro.stepper).toHaveCount(0);
    await expect(registro.chips).toContainText(/Cargue (habilitado|bloqueado)/);
    // "Añadir documento" siempre está; solo se habilita con el cargue habilitado (#916)
    await expect(registro.botonAnadirDocumento).toBeVisible();
    const habilitado = (await registro.textosChips()).includes('Cargue habilitado');
    await (habilitado ? expect(registro.botonAnadirDocumento).toBeEnabled() : expect(registro.botonAnadirDocumento).toBeDisabled());
    await testInfo.attach('variante del auditado', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

  await test.step('la ficha abre en Acción, se recorre con flechas y se cierra con Esc', async () => {
    await registro.abrirFicha();
    expect(await registro.ficha.nombrePestanaActiva()).toBe('Acción');
    expect(await registro.ficha.recorrerConFlechas(4)).toEqual(['Hallazgo', 'Auditoría', 'Responsables', 'Acción']);
    await testInfo.attach('ficha de la acción', { body: await page.screenshot(), contentType: 'image/png' });
    await registro.ficha.cerrarConEscape();
  });

  await test.step('la causa de la ficha es la que escribió la dependencia en la acción, no el criterio de fase 3', async () => {
    await registro.abrirFichaEnHallazgo();
    const causa = String(accion.causa ?? '').trim();
    await expect(registro.ficha.dato('Causa')).toHaveText(causa || '—');
    const criterio = String(accion.hallazgo_id?.criterio ?? '').trim();
    if (criterio && criterio !== causa) await expect(registro.ficha.dato('Causa')).not.toHaveText(criterio);
    await testInfo.attach('causa en la ficha', { body: await page.screenshot(), contentType: 'image/png' });
    await registro.ficha.cerrar();
  });

  await test.step('ya no hay "Ver hallazgo" ni "Ver acción": el hallazgo se consulta en la pestaña de la ficha (#947)', async () => {
    await expect(registro.enlacesVerDetalle).toHaveCount(0);
    await registro.abrirFichaEnHallazgo();
    expect(await registro.ficha.nombrePestanaActiva()).toBe('Hallazgo');
    await registro.ficha.cerrar();
  });

  await test.step('a 390 px no hay desborde horizontal', async () => {
    await registro.cambiarAncho(390);
    await expect.poll(() => registro.anchoDocumento()).toBeLessThanOrEqual(390);
    await testInfo.attach('390 px', { body: await page.screenshot(), contentType: 'image/png' });
  });

  expect(escriturasBloqueadas).toEqual([]);
});
