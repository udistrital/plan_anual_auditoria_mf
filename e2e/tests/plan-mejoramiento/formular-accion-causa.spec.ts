// spec: e2e/specs/formulacion-dependencias-hallazgos.plan.md
import { test, expect } from '../../core/fixtures';
import { FormularPlanPage } from '../../pages/formular-plan.page';
import { AUDITORIA_FORMULACION, esGetAccionesTabla, esGetHallazgosTabla, GET_PLAN, planEnCreando } from './formulacion';

test(
  'la causa de la acción es un texto abierto que escribe la dependencia',
  { tag: ['@plan-mejoramiento', '@jefe-dependencia', '@lectura', '@simulado'] },
  async ({ page, escriturasBloqueadas, simularGet }, testInfo) => {
    await simularGet(GET_PLAN, planEnCreando);
    const plan = new FormularPlanPage(page);

    const acciones = page.waitForResponse((r) => r.request().method() === 'GET' && esGetAccionesTabla(r.url()), { timeout: 90_000 });
    const hallazgos = page.waitForResponse((r) => r.request().method() === 'GET' && esGetHallazgosTabla(r.url()), { timeout: 90_000 });
    await test.step('abre Registrar plan de un plan en Creando (simulado)', () => plan.abrir(AUDITORIA_FORMULACION));
    const accionesData: any[] = (await (await acciones).json())?.Data ?? [];
    const hallazgosData: any[] = (await (await hallazgos).json())?.Data ?? [];

    await test.step('al agregar una acción, la causa es un campo editable, obligatorio y con contador', async () => {
      const modal = await plan.abrirAgregarAccion(plan.filasHallazgo.first());
      await expect(modal.causa).toBeEditable();
      await expect(modal.causa).toHaveValue('');
      await expect(modal.contadorCausa).toHaveText(/0\s*\/\s*1000/);

      await modal.escribirCausa('Falta de seguimiento a los registros');
      await expect(modal.contadorCausa).toHaveText(/36\s*\/\s*1000/);
      await expect(modal.causa).toHaveAttribute('maxlength', '1000');

      await modal.escribirCausa('');
      await modal.causa.blur();
      await expect(modal.errorCausa).toHaveText('Campo requerido');
      await testInfo.attach('causa obligatoria', { body: await page.screenshot(), contentType: 'image/png' });
      await modal.descartar();
    });

    await test.step('en la tabla y al editar, la causa sale de la acción y no del criterio del hallazgo', async () => {
      const conAcciones = plan.filasHallazgo.filter({ hasText: /acción\(es\) formulada\(s\)/ }).first();
      expect(
        accionesData.length && (await conAcciones.count()),
        `el plan de E2E_AUDITORIA_FORMULACION (${AUDITORIA_FORMULACION}) no tiene acciones en la primera página: use otro plan`,
      ).toBeTruthy();
      await plan.expandirHallazgo(conAcciones);
      const fila = plan.filasAccion.first();
      const textoCausa = (await plan.causaEnFila(fila).innerText()).trim();

      const causas = accionesData.map((a) => (a.causa ?? '').trim());
      const criterios = hallazgosData.map((h) => (h.criterio ?? '').trim()).filter(Boolean);
      expect([...causas.filter(Boolean), 'Sin causa registrada']).toContain(textoCausa);
      if (!causas.includes(textoCausa)) expect(criterios).not.toContain(textoCausa);

      const modal = await plan.abrirEditarAccion(fila);
      const valor = await modal.causa.inputValue();
      expect(textoCausa === 'Sin causa registrada' ? '' : textoCausa).toBe(valor);
      await testInfo.attach('causa de la acción al editar', { body: await page.screenshot(), contentType: 'image/png' });
      await modal.descartar();
    });

    expect(escriturasBloqueadas).toEqual([]);
  },
);
