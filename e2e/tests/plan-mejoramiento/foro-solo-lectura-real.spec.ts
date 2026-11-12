// spec: e2e/specs/foro-accion.plan.md
import { test, expect } from '../../core/fixtures';
import { personaDe } from '../programacion/limpieza';
import { RUTA_GESTION_ACCIONES } from '../../pages/gestion-acciones.page';
import { abrirAccion } from './datos';

/** MID contra el que corre el escenario (el mismo del MF compilado con `local`). */
const MID = (process.env['E2E_MID_URL'] || 'http://localhost:8081').replace(/\/$/, '');

/**
 * Acciones candidatas donde buscar una que la cuenta NO tenga como responsable y que además cargue en
 * Registro de avances. Se pueden fijar con E2E_ACCIONES_CANDIDATAS (ids separados por coma); por defecto,
 * acciones activas del ambiente de pruebas.
 */
const CANDIDATAS = (process.env['E2E_ACCIONES_CANDIDATAS'] || '6a25babec5406015a57e555d,6a23627bc5406015a57e5203,6a1f793407285e4ff77b2229,6a2191a207285e4ff77b61b5,6a2083ddfde7b5c708bc274d')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

// @lectura: sin simular nada. El MID decide de verdad que esta dependencia no puede comentar y el panel lo refleja.
test('una dependencia que no es responsable de la acción ve el foro en solo lectura, según el MID', { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura'] }, async ({ page, request, escriturasBloqueadas }, testInfo) => {
  // Se entra por la acción propia de la cuenta (como el usuario) para tener sesión, persona y token.
  const registro = await abrirAccion(page, 'registrar-avances');
  const propia = page.url().match(/registrar-avances\/([0-9a-f]{24})/)![1];
  const persona = await personaDe(page);
  expect(persona, 'la cuenta debe tener persona_id').toBeDefined();
  const token = await page.evaluate(() => localStorage.getItem('access_token'));

  const consultaMid = async (id: string) =>
    request.get(`${MID}/accion-mejora/${id}/comentario?limit=1&persona_id=${persona}&rol=JEFE_DEPENDENCIA`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  await test.step('en su propia acción el MID dice que puede comentar', async () => {
    const r = await consultaMid(propia);
    expect((await r.json()).MetaData.puede_comentar).toBe(true);
  });

  let ajena: string | undefined;
  const diagnostico: string[] = [];
  await test.step('en una acción ajena el MID dice que no puede y el foro abre en solo lectura', async () => {
    for (const id of CANDIDATAS.filter((c) => c !== propia)) {
      const r = await consultaMid(id);
      const puede = r.ok() ? (await r.json())?.MetaData?.puede_comentar : `HTTP ${r.status()}`;
      if (puede !== false) {
        diagnostico.push(`${id}: puede_comentar=${puede}`);
        continue;
      }
      await page.goto(`${RUTA_GESTION_ACCIONES}/registrar-avances/${id}`);
      // Hay acciones antiguas que no cargan en Registro de avances (sin relación con el foro): se prueba la siguiente
      const carga = await registro.encabezado.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true, () => false);
      if (!carga) {
        diagnostico.push(`${id}: ajena pero no carga en Registro de avances`);
        continue;
      }
      ajena = id;
      break;
    }
    expect(ajena, `ninguna acción candidata es ajena a la cuenta y carga (fija E2E_ACCIONES_CANDIDATAS):\n${diagnostico.join('\n')}`).toBeDefined();
    await registro.abrirForo();
    await expect(registro.foro.soloLectura).toBeVisible();
    await expect(registro.foro.campo).toHaveCount(0);
    await expect(registro.foro.botonEnviar).toHaveCount(0);
    await testInfo.attach('solo lectura real', { body: await page.screenshot(), contentType: 'image/png' });
  });

  expect(escriturasBloqueadas).toEqual([]);
});
