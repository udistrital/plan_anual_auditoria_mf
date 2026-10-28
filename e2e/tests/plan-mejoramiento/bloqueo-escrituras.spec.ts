// spec: e2e/specs/registro-avances.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

test('una corrida de lectura no puede cambiar el estado del cargue', { tag: ['@plan-mejoramiento', '@auditor', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = await abrirAccion(page, 'revisar');
  const estadoInicial = (await registro.textosChips()).find((c) => c.startsWith('Cargue'));

  await test.step('el auditor confirma el cambio del cargue', async () => {
    await registro.botonCargue.click();
    await registro.textoAlerta();
    await registro.confirmarAlerta();
  });

  await test.step('el marco aborta el PUT y la aplicación informa el error', async () => {
    await expect(registro.alerta).toContainText('No se pudo actualizar el estado del cargue.');
    expect(escriturasBloqueadas).toEqual([expect.stringMatching(/^PUT .*\/accion-mejora\/[0-9a-f]{24}$/)]);
    await testInfo.attach('escritura bloqueada', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('al recargar, el estado del cargue no cambió', async () => {
    await page.reload();
    await registro.esperarCarga();
    await expect(registro.chips).toContainText(estadoInicial!);
  });
});
