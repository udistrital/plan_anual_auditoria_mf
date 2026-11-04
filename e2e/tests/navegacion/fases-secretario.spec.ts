// spec: e2e/specs/navegacion-por-fases.plan.md
import { test, expect } from '../../core/fixtures';
import { ShellPage } from '../../pages/shell.page';
import { ASIGNAR_AUDITORIAS, AUDITORIAS_ESPECIALES, MENU_PRINCIPAL_POR_ROL, PROGRAMACION_REVISION } from './fases';

test('el secretario navega por Programación desde el menú', { tag: ['@navegacion', '@secretario', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const shell = new ShellPage(page);
  await shell.abrirInicio();

  await test.step('el menú muestra los módulos del secretario', async () => {
    await shell.abrirMenu();
    expect(await shell.nombresMenu()).toEqual(MENU_PRINCIPAL_POR_ROL['secretario']);
  });

  await test.step('no ve Asignar Auditorías ni Registro Auditorías Especiales', async () => {
    const opciones = await shell.nombresSubmenu('Gestión de Auditoría', 'Programación');
    expect(opciones).toEqual(PROGRAMACION_REVISION.map((f) => f.menu[2]));
    expect(opciones).not.toContain(ASIGNAR_AUDITORIAS.menu[2]);
    expect(opciones).not.toContain(AUDITORIAS_ESPECIALES.menu[2]);
  });

  for (const fase of PROGRAMACION_REVISION) {
    await test.step(fase.menu.join(' › '), async () => {
      await shell.navegarPorMenu(...fase.menu);
      await expect(page).toHaveURL(new RegExp(`${fase.url}$`));
      await expect(shell.tituloPantalla).toHaveText(fase.titulo);
      await testInfo.attach(fase.menu.slice(-2).join(' › '), { body: await page.screenshot(), contentType: 'image/png' });
    });
  }

  expect(escriturasBloqueadas, 'navegar no debe intentar escribir').toEqual([]);
});
