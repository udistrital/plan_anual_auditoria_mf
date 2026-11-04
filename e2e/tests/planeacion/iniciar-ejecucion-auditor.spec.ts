// spec: e2e/specs/estabilizacion-ejecucion.plan.md
import { test, expect } from '../../core/fixtures';
import { AuditoriasInternasPage } from '../../pages/auditorias-internas.page';
import { environment } from '../../../src/environments/environment.development';
import { SEMILLA_INICIAR_EJECUCION as SEMILLA, VIGENCIA_SEMILLA } from '../ejecucion/datos';

test('el auditor asignado inicia la ejecución y el cambio de estado lleva su rol', { tag: ['@planeacion', '@auditor', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const planeacion = new AuditoriasInternasPage(page, 'planeacion');
  const fila = planeacion.filaAuditoria(SEMILLA.titulo);

  await test.step(`la auditoría semilla "${SEMILLA.titulo}", con el programa aprobado por el auditado, ofrece Iniciar Ejecución`, async () => {
    await planeacion.abrir();
    await planeacion.elegirVigencia(VIGENCIA_SEMILLA);
    await expect(fila, `la vigencia ${VIGENCIA_SEMILLA} debería tener la semilla (tests/semillas/ejecucion-2010.spec.ts)`).toBeVisible({ timeout: 90_000 });
    expect(await planeacion.abrirAcciones(fila)).toContain('Iniciar Ejecución');
    await planeacion.cerrarAcciones();
  });

  await test.step('al confirmar, el cambio de estado a Por Ejecutar registra el rol AUDITOR (la escritura se bloquea)', async () => {
    const peticion = page.waitForRequest((r) => r.method() === 'POST' && /\/auditoria-estado$/.test(new URL(r.url()).pathname));
    await planeacion.accion(fila, 'Iniciar Ejecución');
    expect(await planeacion.textoAlerta()).toContain('¿Está seguro(a) de iniciar la ejecución de esta auditoría?');
    await planeacion.confirmarAlerta();
    const cuerpo = (await peticion).postDataJSON();
    await testInfo.attach('cuerpo del cambio de estado (bloqueado)', { body: JSON.stringify({ ...cuerpo, usuario_id: '<persona>' }, null, 2), contentType: 'application/json' });
    expect(cuerpo).toMatchObject({
      estado_id: environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR,
      fase_id: environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR,
      usuario_rol: environment.ROL.AUDITOR,
    });
  });

  expect(escriturasBloqueadas, 'la única escritura que intenta es el cambio de estado').toEqual([expect.stringMatching(/^POST .*\/auditoria-estado$/)]);
});
