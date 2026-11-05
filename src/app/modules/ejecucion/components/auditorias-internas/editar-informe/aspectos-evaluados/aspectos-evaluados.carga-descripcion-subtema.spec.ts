import { UntypedFormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { AspectosEvaluadosComponent } from './aspectos-evaluados.component';

// Descripción de subtema con imagen guardada en Nuxeo y su contenido HTML (base64, como lo devuelve el gestor)
const HTML_CON_IMAGEN = '<p>Evidencia del subtema</p><p><img src="data:image/png;base64,iVBORw0KGgo=" style="width: 300px;"></p>';
const base64 = (texto: string) => btoa(String.fromCharCode(...new TextEncoder().encode(texto)));

const subtema = (id: string, titulo: string, descripcion?: string) => ({ _id: id, titulo, activo: true, descripcion });

const temaConSubtemas = (subtemas: any[]) => ({
  _id: 't1', titulo: 'Tema', activo: true, descripcion_titulo: '<p>Texto del tema</p>', subtema: subtemas,
});

describe('AspectosEvaluadosComponent - descripción del subtema desde el gestor documental', () => {
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
    component.temasData = [temaConSubtemas([
      subtema('s1', 'Subtema que carga', 'NuxeoEnlace:uuid-ok'),
      subtema('s2', 'Subtema con el gestor caído', 'NuxeoEnlace:uuid-caido'),
      subtema('s3', 'Subtema con texto', '<p>Descripción en texto</p>'),
      subtema('s4', 'Subtema sin descripción'),
    ])] as any;
    await component.construirFormulario();
  });

  afterEach(() => jest.restoreAllMocks());

  const subtemas = () => component.getSubtemas(0);

  it('arma todos los subtemas en su orden aunque la descripción de uno no se pueda descargar', () => {
    expect(subtemas().controls.map((s) => s.get('nombre')?.value)).toEqual([
      'Subtema que carga', 'Subtema con el gestor caído', 'Subtema con texto', 'Subtema sin descripción',
    ]);
    expect(subtemas().at(0).get('descripcion')?.value).toContain('<img');
    expect(subtemas().at(2).get('descripcion')?.value).toBe('<p>Descripción en texto</p>');
    expect(subtemas().at(3).get('descripcion')?.value).toBe('');
  });

  it('marca sólo el subtema cuya descripción falló y avisa al usuario', () => {
    expect(subtemas().controls.map((s) => component.descripcionSubtemaNoDisponible(s))).toEqual([false, true, false, false]);
    expect(alertService.showAlert).toHaveBeenCalledWith('Descripción no disponible', expect.stringContaining('1 subtema(s)'));
  });

  it('al guardar conserva el enlace del subtema no cargado y reutiliza el del subtema sin cambios', async () => {
    await component.guardarAspectos();

    expect(planService.put).toHaveBeenCalledWith('subtema/s1', { titulo: 'Subtema que carga', descripcion: 'NuxeoEnlace:uuid-ok' });
    expect(planService.put).toHaveBeenCalledWith('subtema/s2', { titulo: 'Subtema con el gestor caído', descripcion: 'NuxeoEnlace:uuid-caido' });
    expect(planService.put).toHaveBeenCalledWith('subtema/s3', { titulo: 'Subtema con texto', descripcion: '<p>Descripción en texto</p>' });
  });

  it('guarda como cadena vacía la descripción que el editor deja sin contenido', async () => {
    subtemas().at(3).get('descripcion')?.setValue('<p><br></p>');

    await component.guardarAspectos();

    expect(planService.put).toHaveBeenCalledWith('subtema/s4', { titulo: 'Subtema sin descripción', descripcion: '' });
  });

  it('sin fallas no muestra el aviso', async () => {
    alertService.showAlert.mockClear();
    component.temasData = [temaConSubtemas([subtema('s1', 'Subtema que carga', 'NuxeoEnlace:uuid-ok')])] as any;
    await component.construirFormulario();

    expect(component.descripcionSubtemaNoDisponible(subtemas().at(0))).toBe(false);
    expect(alertService.showAlert).not.toHaveBeenCalled();
  });
});
