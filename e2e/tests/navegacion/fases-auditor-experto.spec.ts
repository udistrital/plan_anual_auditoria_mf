// spec: e2e/specs/navegacion-por-fases.plan.md
import { test, expect } from '../../core/fixtures';
import { ShellPage } from '../../pages/shell.page';
import { MENU_PRINCIPAL_POR_ROL, PROGRAMACION_COMPLETA } from './fases';

test('el auditor experto navega por Programación desde el menú', { tag: ['@navegacion', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const shell = new ShellPage(page);
  await shell.abrirInicio();

  await test.step('el menú muestra los módulos del auditor experto', async () => {
    await shell.abrirMenu();
    expect(await shell.nombresMenu()).toEqual(MENU_PRINCIPAL_POR_ROL['auditor-experto']);
  });

  await test.step('Programación tiene sus tres opciones', async () => {
    expect(await shell.nombresSubmenu('Gestión de Auditoría', 'Programación')).toEqual(PROGRAMACION_COMPLETA.map((f) => f.menu[2]));
  });

  for (const fase of PROGRAMACION_COMPLETA) {
    await test.step(fase.menu.join(' › '), async () => {
      await shell.navegarPorMenu(...fase.menu);
      await expect(page).toHaveURL(new RegExp(`${fase.url}$`));
      await expect(shell.tituloPantalla).toHaveText(fase.titulo);
      await testInfo.attach(fase.menu.slice(-2).join(' › '), { body: await page.screenshot(), contentType: 'image/png' });
    });
  }

  expect(escriturasBloqueadas, 'navegar no debe intentar escribir').toEqual([]);
});
