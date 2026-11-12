// spec: e2e/specs/foro-accion.plan.md
import { test, expect } from '../../core/fixtures';
import { RegistroAvancesPage } from '../../pages/registro-avances.page';
import { abrirAccion } from './datos';
import { ApiForo, marcadorE2E } from './foro-api';

// @escritura: una conversación real entre dos usuarios. El proyecto es el del auditor (primer rol);
// Control Interno entra con comoRol('jefe-oci'). Corre contra el CRUD y el MID LOCALES; todo se borra al final.
test('el auditor y el Jefe de Control Interno conversan en el foro y cada uno ve lo del otro tras actualizar', { tag: ['@plan-mejoramiento', '@auditor', '@escritura'] }, async ({ page, request, limpieza, comoRol }, testInfo) => {
  const registro = await abrirAccion(page, 'revisar');
  const accionId = page.url().match(/(?:registrar-avances|revisar)\/([0-9a-f]{24})/)![1];
  const api = new ApiForo(request, page);
  const marca = marcadorE2E();
  const delAuditor = `${marca} pregunta del auditor`;
  const delJefe = `${marca} respuesta del jefe`;

  await api.liberarAccion(accionId);
  limpieza.registrar('borrar los comentarios E2E de la acción', () => api.liberarAccion(accionId));

  await test.step('el auditor publica una pregunta', async () => {
    await registro.abrirForo();
    await registro.foro.enviar(delAuditor);
    await expect(registro.foro.mensajesCon(delAuditor)).toHaveCount(1);
  });

  const paginaJefe = await comoRol('jefe-oci');
  const registroJefe = new RegistroAvancesPage(paginaJefe);

  await test.step('el Jefe de Control Interno abre el foro, ve la pregunta del auditor y responde', async () => {
    await registroJefe.abrir(accionId, 'revisar');
    await registroJefe.abrirForo();
    const pregunta = registroJefe.foro.mensajesCon(delAuditor);
    await expect(pregunta).toHaveCount(1);
    expect(await registroJefe.foro.cabecera(pregunta)).toMatch(/ · Auditor/);
    await expect(registroJefe.foro.campo).toBeVisible();
    await registroJefe.foro.enviar(delJefe);
    await expect(registroJefe.foro.mensajesCon(delJefe)).toHaveCount(1);
  });

  await test.step('el auditor actualiza y ve la respuesta con el rol de Jefe de Control Interno, después de su pregunta', async () => {
    await registro.foro.actualizar();
    const respuesta = registro.foro.mensajesCon(delJefe);
    await expect(respuesta).toHaveCount(1);
    expect(await registro.foro.cabecera(respuesta)).toContain('Jefe de Control Interno');
    const textos = await registro.foro.mensajes.filter({ hasText: marca }).locator('.mensaje-texto').allInnerTexts();
    expect(textos.map((t) => t.trim())).toEqual([delAuditor, delJefe]);
    await testInfo.attach('conversación entre dos roles', { body: await page.screenshot(), contentType: 'image/png' });
  });

  await test.step('los dos mensajes quedaron guardados una sola vez', async () => {
    const guardados = (await api.activosE2E(accionId)).map((c) => c.mensaje).sort();
    expect(guardados).toEqual([delAuditor, delJefe].sort());
  });
});
