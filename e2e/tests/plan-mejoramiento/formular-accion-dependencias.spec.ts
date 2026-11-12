// spec: e2e/specs/formulacion-dependencias-hallazgos.plan.md
import { test, expect } from '../../core/fixtures';
import { FormularPlanPage } from '../../pages/formular-plan.page';
import {
  AUDITORIA_FORMULACION,
  esGetResponsablesTabla,
  GET_PLAN,
  planEnCreando,
  simularDependenciasAuditoria,
} from './formulacion';

test(
  'las dependencias líderes se eligen de una lista y el apoyo es opcional',
  { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura', '@simulado'] },
  async ({ page, escriturasBloqueadas, simularGet }, testInfo) => {
    await simularGet(GET_PLAN, planEnCreando);
    const plan = new FormularPlanPage(page);

    const responsables = page.waitForResponse((r) => r.request().method() === 'GET' && esGetResponsablesTabla(r.url()), { timeout: 90_000 });
    const auditoria = page.waitForResponse(
      (r) => r.request().method() === 'GET' && new RegExp(`/auditoria/${AUDITORIA_FORMULACION}$`).test(new URL(r.url()).pathname),
      { timeout: 90_000 },
    );
    await test.step('abre Registrar plan de un plan en Creando (simulado)', () => plan.abrir(AUDITORIA_FORMULACION));
    const responsablesData: any[] = (await (await responsables).json())?.Data ?? [];
    const depsAuditoria: number[] = [(await (await auditoria).json())?.Data?.dependencia_id ?? []].flat().map(Number);

    await test.step('con una sola dependencia en la auditoría, el select la trae seleccionada y deshabilitado', async () => {
      expect(depsAuditoria.length, 'la auditoría semilla debe tener una sola dependencia').toBe(1);
      const modal = await plan.abrirAgregarAccion(plan.filasHallazgo.first());
      await expect(modal.selectLideres).toBeDisabled();
      await expect(modal.selectLideres).not.toHaveText(/Seleccione/);
      await expect(modal.errorLider).toBeHidden();
      await modal.descartar();
    });

    await test.step('el apoyo es opcional: «No» oculta el selector y «Sí» lo muestra', async () => {
      const modal = await plan.abrirAgregarAccion(plan.filasHallazgo.first());
      await expect(modal.apoyoNo).toBeChecked();
      await expect(modal.selectorApoyo).toBeHidden();
      await expect(modal.botonVincular).toBeHidden();

      await modal.apoyoSi.check();
      await expect(modal.selectorApoyo).toBeVisible();
      await expect(modal.botonVincular).toBeDisabled();
      await modal.botonVincular.scrollIntoViewIfNeeded();
      await testInfo.attach('apoyo con Sí', { body: await page.screenshot(), contentType: 'image/png' });

      await modal.apoyoNo.check();
      await expect(modal.selectorApoyo).toBeHidden();
      // Sin apoyo el formulario puede quedar completo (antes exigía al menos una de apoyo)
      await modal.escribirCausa('Causa de prueba');
      await modal.dialogo.getByRole('radio', { name: /Preventiva/ }).check();
      await modal.dialogo.getByRole('textbox', { name: /Acción planteada/ }).fill('Implementar un control');
      await expect(modal.estadoFormulario).toHaveText(/Campos obligatorios completos/);
      await modal.descartar();
    });

    await test.step('con varias dependencias el select inicia vacío y se eligen una o más líderes (al menos una)', async () => {
      // Segunda dependencia: otra responsable de las acciones del plan (existe en Oikos, con nombre real)
      const otra = [...new Set(responsablesData.map((r) => Number(r.dependencia_id)))].find((id) => id && !depsAuditoria.includes(id));
      expect(depsAuditoria.length && otra, 'el plan semilla debe tener una acción con una responsable que no sea de la auditoría').toBeTruthy();

      await simularDependenciasAuditoria(page, AUDITORIA_FORMULACION, [depsAuditoria[0], otra!]);
      await page.reload();
      await expect(plan.titulo).toBeVisible({ timeout: 60_000 });
      await expect(plan.filasHallazgo.first()).toBeVisible({ timeout: 60_000 });

      const modal = await plan.abrirAgregarAccion(plan.filasHallazgo.first());
      await expect(modal.selectLideres).toBeEnabled();
      // Solo lista las dependencias de la auditoría, y ninguna viene seleccionada
      const opciones = await modal.opcionesLideres();
      expect(opciones).toHaveLength(2);
      expect(opciones.every((o) => !o.seleccionada)).toBe(true);
      const [primera, segunda] = opciones.map((o) => o.nombre);

      // Con los demás obligatorios llenos, lo único que falta es la líder
      await modal.escribirCausa('Causa de prueba');
      await modal.dialogo.getByRole('radio', { name: /Preventiva/ }).check();
      await modal.dialogo.getByRole('textbox', { name: /Acción planteada/ }).fill('Implementar un control');
      await expect(modal.estadoFormulario).toHaveText(/Faltan campos obligatorios/);

      // Las dos como líderes
      await modal.alternarLideres([primera, segunda]);
      expect((await modal.opcionesLideres()).every((o) => o.seleccionada)).toBe(true);
      await expect(modal.estadoFormulario).toHaveText(/Campos obligatorios completos/);
      await modal.apoyoNo.scrollIntoViewIfNeeded();
      await testInfo.attach('dos dependencias líderes', { body: await page.screenshot(), contentType: 'image/png' });

      // Se quita una: queda una sola líder
      await modal.alternarLideres([segunda]);
      await expect(modal.selectLideres).toHaveText(new RegExp(primera.slice(0, 15)));
      await expect(modal.errorLider).toBeHidden();
      await expect(modal.estadoFormulario).toHaveText(/Campos obligatorios completos/);

      // Sin ninguna líder aparece el aviso y el formulario no está completo
      await modal.alternarLideres([primera]);
      await expect(modal.errorLider).toBeVisible();
      await expect(modal.estadoFormulario).toHaveText(/Faltan campos obligatorios/);
      await modal.apoyoNo.scrollIntoViewIfNeeded();
      await testInfo.attach('sin dependencia líder', { body: await page.screenshot(), contentType: 'image/png' });
      await modal.apoyoNo.scrollIntoViewIfNeeded();
      await testInfo.attach('dos dependencias líderes', { body: await page.screenshot(), contentType: 'image/png' });
      await modal.descartar();
    });

    await test.step('al editar, los líderes y el apoyo guardados se precargan', async () => {
      const conAcciones = plan.filasHallazgo.filter({ hasText: /acción\(es\) formulada\(s\)/ }).first();
      await plan.expandirHallazgo(conAcciones);
      // Responsables que el modal consulta de esa acción (accion_mejora_id:…, no el __in de la tabla)
      const guardados = page.waitForResponse(
        (r) => r.request().method() === 'GET' && /\/responsable-accion\?query=accion_mejora_id:[0-9a-f]{24},/.test(decodeURIComponent(r.url())),
        { timeout: 60_000 },
      );
      const modal = await plan.abrirEditarAccion(plan.filasAccion.first());
      const datos: any[] = (await (await guardados).json())?.Data ?? [];
      const lideres = datos.filter((r) => r.dependencia_lider).length;
      const apoyo = datos.filter((r) => !r.dependencia_lider).length;

      await expect(modal.chipsApoyo).toHaveCount(apoyo);
      await expect(apoyo ? modal.apoyoSi : modal.apoyoNo).toBeChecked();
      if (await modal.selectLideres.isDisabled()) {
        // Una sola candidata: queda seleccionada aunque la acción antigua no tuviera líder guardado
        await expect(modal.selectLideres).not.toHaveText(/Seleccione/);
        await expect(modal.errorLider).toBeHidden();
      } else {
        // Las seleccionadas son las líderes guardadas; sin ninguna, el aviso aparece de entrada
        expect((await modal.opcionesLideres()).filter((o) => o.seleccionada)).toHaveLength(lideres);
        await (lideres ? expect(modal.errorLider).toBeHidden() : expect(modal.errorLider).toBeVisible());
      }
      await modal.apoyoNo.scrollIntoViewIfNeeded();
      await testInfo.attach('editar: responsables guardados', { body: await page.screenshot(), contentType: 'image/png' });

      // «No» quita las de apoyo (se eliminarían al guardar); «Sí» vuelve con el selector vacío
      await modal.apoyoNo.check();
      await expect(modal.chipsApoyo).toHaveCount(0);
      await expect(modal.selectorApoyo).toBeHidden();
      await modal.apoyoSi.check();
      await expect(modal.selectorApoyo).toBeVisible();
      await expect(modal.chipsApoyo).toHaveCount(0);
      await expect(modal.botonVincular).toBeDisabled();
      await modal.descartar();
    });

    expect(escriturasBloqueadas).toEqual([]);
  },
);
