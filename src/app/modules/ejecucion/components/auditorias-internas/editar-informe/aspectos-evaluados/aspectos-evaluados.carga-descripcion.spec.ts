import { UntypedFormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { AspectosEvaluadosComponent } from './aspectos-evaluados.component';

// Descripción de tema con imagen guardada en Nuxeo y su contenido HTML (base64, como lo devuelve el gestor)
const HTML_CON_IMAGEN = '<p>Hallazgo con evidencia</p><p><img src="data:image/png;base64,iVBORw0KGgo=" style="width: 300px;"></p>';
const base64 = (texto: string) => btoa(String.fromCharCode(...new TextEncoder().encode(texto)));

const tema = (id: string, titulo: string, enlace: string) => ({
  _id: id, titulo, activo: true, descripcion_titulo: `NuxeoEnlace:${enlace}`, subtema: [],
});

describe('AspectosEvaluadosComponent - carga de descripciones desde el gestor documental', () => {
  let component: AspectosEvaluadosComponent;
  let planService: { get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock };
  let alertService: { showAlert: jest.Mock; showConfirmAlert: jest.Mock };
  let nuxeoService: { obtenerPorUUID: jest.Mock };

  beforeEach(async () => {
    planService = { get: jest.fn(), post: jest.fn(), put: jest.fn(() => of({})), delete: jest.fn() };
    alertService = { showAlert: jest.fn(), showConfirmAlert: jest.fn() };
    nuxeoService = {
      obtenerPorUUID: jest.fn((uuid: string) =>
        uuid === 'uuid-caido' ? Promise.reject(new Error('404 del gestor')) : Promise.resolve(base64(HTML_CON_IMAGEN))),
    };
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    component = new AspectosEvaluadosComponent(
      new UntypedFormBuilder(), planService as any, alertService as any, nuxeoService as any, {} as any);
    component.informeId = 'informe-1';
    component.temasData = [tema('t1', 'Tema que carga', 'uuid-ok'), tema('t2', 'Tema con el gestor caído', 'uuid-caido')] as any;
    await component.construirFormulario();
  });

  afterEach(() => jest.restoreAllMocks());

  it('arma todos los temas en su orden aunque la descripción de uno no se pueda descargar', () => {
    expect(component.temas.length).toBe(2);
    expect(component.temas.controls.map((t) => t.get('nombre')?.value)).toEqual(['Tema que carga', 'Tema con el gestor caído']);
    expect(component.temas.at(0).get('descripcion_titulo')?.value).toContain('<img');
  });

  it('marca sólo el tema cuya descripción falló y avisa al usuario', () => {
    expect(component.descripcionNoDisponible(component.temas.at(0))).toBe(false);
    expect(component.descripcionNoDisponible(component.temas.at(1))).toBe(true);
    expect(alertService.showAlert).toHaveBeenCalledWith('Descripción no disponible', expect.stringContaining('1 tema(s)'));
  });

  it('al guardar conserva el enlace de Nuxeo del tema no cargado y reutiliza el del tema sin cambios', async () => {
    await component.guardarAspectos();

    expect(planService.put).toHaveBeenCalledWith('tema/t1', { titulo: 'Tema que carga', descripcion_titulo: 'NuxeoEnlace:uuid-ok' });
    expect(planService.put).toHaveBeenCalledWith('tema/t2', { titulo: 'Tema con el gestor caído', descripcion_titulo: 'NuxeoEnlace:uuid-caido' });
  });

  it('sin fallas no muestra el aviso', async () => {
    alertService.showAlert.mockClear();
    component.temasData = [tema('t1', 'Tema que carga', 'uuid-ok')] as any;
    await component.construirFormulario();

    expect(component.descripcionNoDisponible(component.temas.at(0))).toBe(false);
    expect(alertService.showAlert).not.toHaveBeenCalled();
  });
});
