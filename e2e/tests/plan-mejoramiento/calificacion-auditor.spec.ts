// spec: e2e/specs/registro-avances.plan.md
import { test, expect } from '../../core/fixtures';
import { abrirAccion } from './datos';

test('el auditor revisa la acción y valida el formulario de calificación', { tag: ['@plan-mejoramiento', '@auditor', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = await test.step('entra desde Gestión de acciones con "Revisar y calificar"', () => abrirAccion(page, 'revisar'));
  const formulario = registro.formulario;

  await test.step('ve la variante del auditor asignado', async () => {
    await expect(registro.tituloEvidencias).toHaveText('Evidencias de la dependencia');
    await expect(registro.tituloCalificacion).toHaveText('Calificación del auditor');
    await expect(registro.botonCargue).toBeVisible();
    await expect(registro.botonAnadirDocumento).toHaveCount(0);
  });

  await test.step('calificar vacío muestra 3 errores y enfoca el porcentaje', async () => {
    await registro.iniciarCalificacion();
    await formulario.botonCalificar.click();
    await expect(formulario.errores).toHaveCount(3);
    await expect.poll(() => formulario.campoConFoco()).toBe('Porcentaje de avance');
    await testInfo.attach('validaciones', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('60 % sugiere "En progreso"', async () => {
    await formulario.escribirPorcentaje(60);
    await expect(formulario.criterioSeleccionado).toHaveText('En progreso');
  });

  await test.step('elegir otro criterio muestra el aviso de diferencia', async () => {
    await formulario.elegirCriterio('Satisfactorio');
    await expect(formulario.avisoCoherencia).toBeVisible();
  });

  await test.step('al escribir el análisis desaparecen los errores', async () => {
    await formulario.analisis.fill('Se revisaron el acta de la mesa de trabajo y el informe de resultados del periodo.');
    await expect(formulario.errores).toHaveCount(0);
    await testInfo.attach('formulario diligenciado', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('calificar pide confirmación y se cancela', async () => {
    await formulario.botonCalificar.click();
    expect(await registro.textoAlerta()).toMatch(/calific/i);
    await registro.cancelarAlerta();
  });

  expect(escriturasBloqueadas).toEqual([]);
});
