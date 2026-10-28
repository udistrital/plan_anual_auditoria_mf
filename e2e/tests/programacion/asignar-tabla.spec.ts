// spec: e2e/specs/programacion.plan.md
import { test, expect } from '../../core/fixtures';
import { AsignarAuditoriasPage } from '../../pages/asignar-auditorias.page';
import { COLUMNAS_ASIGNAR, VIGENCIA_CON_AUDITORIAS, VIGENCIA_E2E } from './datos';

test('el auditor experto consulta las auditorías del PAA para asignarlas', { tag: ['@programacion', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const asignar = new AsignarAuditoriasPage(page);
  await asignar.abrir();

  await test.step(`la vigencia ${VIGENCIA_CON_AUDITORIAS} lista sus auditorías aprobadas`, async () => {
    await asignar.elegirVigencia(VIGENCIA_CON_AUDITORIAS);
    await expect(asignar.tituloListado).toBeVisible({ timeout: 120_000 });
    await expect(asignar.filas.first()).toBeVisible({ timeout: 120_000 });
    expect((await asignar.encabezados.allInnerTexts()).map((t) => t.trim())).toEqual(COLUMNAS_ASIGNAR);
  });

  await test.step('cada auditoría tiene título, tipo y estado; el subtítulo va después de un guion', async () => {
    const titulos = await asignar.columna('Auditoria');
    for (const titulo of titulos) expect(titulo).not.toEqual('');
    for (const tipo of await asignar.columna('Tipo de Evaluación')) expect(tipo).not.toEqual('');
    for (const estado of await asignar.columna('Estado')) expect(estado).not.toEqual('');
    expect(titulos.some((t) => / - \S/.test(t)), 'alguna auditoría tiene subtítulo').toBe(true);
    await testInfo.attach('auditorías para asignar', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step(`la vigencia ${VIGENCIA_E2E}, sin PAA aprobado, muestra el aviso`, async () => {
    await asignar.elegirVigencia(VIGENCIA_E2E);
    await expect(asignar.alerta).toContainText('Sin plan de auditorías aprobado', { timeout: 60_000 });
    await testInfo.attach('vigencia sin PAA aprobado', { body: await page.screenshot(), contentType: 'image/png' });
    await asignar.confirmarAlerta();
  });

  expect(escriturasBloqueadas, 'consultar no debe intentar escribir').toEqual([]);
});
