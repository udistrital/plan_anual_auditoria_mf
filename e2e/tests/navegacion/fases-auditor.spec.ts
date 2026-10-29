// spec: e2e/specs/navegacion-por-fases.plan.md
import { test, expect } from '../../core/fixtures';
import { ShellPage } from '../../pages/shell.page';
import { FASES_AUDITOR, MENU_PRINCIPAL } from './fases';

test('el auditor navega por las fases desde el menú', { tag: ['@navegacion', '@auditor', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const shell = new ShellPage(page);
  await shell.abrirInicio();

  await test.step('el menú muestra las fases del auditor', async () => {
    await shell.abrirMenu();
    expect(await shell.nombresMenu()).toEqual(MENU_PRINCIPAL);
  });

  for (const fase of FASES_AUDITOR) {
    await test.step(fase.menu.join(' › '), async () => {
      await shell.navegarPorMenu(...fase.menu);
      await expect(page).toHaveURL(new RegExp(`${fase.url}$`));
      await expect(shell.tituloPantalla).toHaveText(fase.titulo);
      await testInfo.attach(fase.menu.slice(-2).join(' › '), { body: await page.screenshot(), contentType: 'image/png' });
    });
  }

  expect(escriturasBloqueadas, 'navegar no debe intentar escribir').toEqual([]);
});
