// spec: e2e/specs/auditorias-externas.plan.md
import path from 'node:path';
import { test, expect } from '../../core/fixtures';
import { AuditoriasExternasPage } from '../../pages/auditorias-externas.page';

const PDF = path.resolve(__dirname, '../../fixtures/acta-e2e.pdf');

test('Continuar sin información general, PDF u hallazgos lista lo que falta y no escribe', { tag: ['@auditorias-externas', '@auditor-experto', '@lectura'] }, async ({ page, escriturasBloqueadas }, testInfo) => {
  const registro = new AuditoriasExternasPage(page);
  await registro.abrirRegistro();

  await test.step('con el registro vacío, la alerta pide la información general, el PDF y un hallazgo', async () => {
    await registro.pulsarContinuar();
    const texto = await registro.pendientesDeLaAlerta();
    expect(texto).toContain('No es posible continuar');
    expect(texto).toContain('Complete la información general de la auditoría.');
    expect(texto).toContain('Adjunte el informe final en formato PDF.');
    expect(texto).toContain('Registre al menos un hallazgo.');
    await testInfo.attach('pendientes con el registro vacío', { body: await page.screenshot(), contentType: 'image/png' });
    await registro.confirmarAlerta();
    await expect(registro.alerta).toBeHidden();
  });

  await test.step('con el PDF adjunto, ya no pide el PDF y sigue pidiendo lo demás', async () => {
    await registro.adjuntarInforme(PDF);
    await expect(registro.seccionInforme).toContainText('acta-e2e.pdf');
    await registro.pulsarContinuar();
    const texto = await registro.pendientesDeLaAlerta();
    expect(texto).not.toContain('Adjunte el informe final en formato PDF.');
    expect(texto).toContain('Complete la información general de la auditoría.');
    expect(texto).toContain('Registre al menos un hallazgo.');
    await testInfo.attach('pendientes con el PDF adjunto', { body: await page.screenshot(), contentType: 'image/png' });
    await registro.confirmarAlerta();
  });

  expect(escriturasBloqueadas, 'Continuar bloqueado no debe enviar nada al servidor').toEqual([]);
});
