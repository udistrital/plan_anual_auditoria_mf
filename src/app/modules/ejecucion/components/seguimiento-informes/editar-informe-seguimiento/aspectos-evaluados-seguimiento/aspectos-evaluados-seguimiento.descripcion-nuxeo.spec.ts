import { UntypedFormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { AspectosEvaluadosSeguimientoComponent } from './aspectos-evaluados-seguimiento.component';

// Descripción de tema con imagen guardada en Nuxeo y su contenido HTML (base64, como lo devuelve el gestor)
const HTML_CON_IMAGEN = '<p>Seguimiento con evidencia</p><p><img src="data:image/png;base64,iVBORw0KGgo=" style="width: 300px;"></p>';
const base64 = (texto: string) => btoa(String.fromCharCode(...new TextEncoder().encode(texto)));

const tema = (id: string, titulo: string, descripcion: string, subtemas: any[] = []) => ({
  _id: id, titulo, activo: true, descripcion_titulo: descripcion, subtema: subtemas,
});

describe('AspectosEvaluadosSeguimientoComponent - descripción del tema en el gestor documental', () => {
  let component: AspectosEvaluadosSeguimientoComponent;
  let planService: { get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock };
  let alertService: { showAlert: jest.Mock; showConfirmAlert: jest.Mock };
  let nuxeoService: { obtenerPorUUID: jest.Mock; fileABase64: jest.Mock; guardarArchivos: jest.Mock };

  beforeEach(() => {
    planService = {
      get: jest.fn(),
      post: jest.fn((coleccion: string) =>
        of(coleccion === 'tema' ? { Data: { _id: 'tema-nuevo' } } : { Data: { subtema: [{ _id: 'subtema-nuevo' }] } })),
      put: jest.fn(() => of({})),
      delete: jest.fn(),
    };
    alertService = { showAlert: jest.fn(), showConfirmAlert: jest.fn() };
    nuxeoService = {
      obtenerPorUUID: jest.fn((uuid: string) =>
        uuid === 'uuid-caido' ? Promise.reject(new Error('404 del gestor')) : Promise.resolve(base64(HTML_CON_IMAGEN))),
      fileABase64: jest.fn(() => Promise.resolve('aHRtbA==')),
      guardarArchivos: jest.fn(() => of([{ res: { Enlace: 'uuid-subido' } }])),
    };
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    component = new AspectosEvaluadosSeguimientoComponent(
      new UntypedFormBuilder(), planService as any, alertService as any, nuxeoService as any);
    component.informeId = 'informe-1';
  });

  afterEach(() => jest.restoreAllMocks());

  it('un tema nuevo con imagen se crea con la descripción subida a Nuxeo, y sus subtemas quedan bajo ese tema', async () => {
    component.temasData = [];
    await component.construirFormulario();
    component.agregarTema();
    component.temas.at(0).patchValue({ nombre: 'Tema con imagen', descripcion_titulo: HTML_CON_IMAGEN });
    component.agregarSubtema(0);
    component.getSubtemas(0).at(0).patchValue({ nombre: 'Subtema 1' });

    await component.guardarAspectos();

    expect(nuxeoService.guardarArchivos).toHaveBeenCalledTimes(1);
    expect(planService.post).toHaveBeenCalledWith('tema', {
      informe_id: 'informe-1', titulo: 'Tema con imagen', descripcion_titulo: 'NuxeoEnlace:uuid-subido',
    });
    expect(planService.post).toHaveBeenCalledWith('subtema', { tema_id: 'tema-nuevo', titulo: 'Subtema 1' });
  });

  it('un tema existente al que se le agrega una imagen se actualiza con el nuevo enlace de Nuxeo', async () => {
    component.temasData = [tema('t1', 'Tema', '<p>Solo texto</p>')] as any;
    await component.construirFormulario();
    component.temas.at(0).patchValue({ descripcion_titulo: HTML_CON_IMAGEN });

    await component.guardarAspectos();

    expect(planService.put).toHaveBeenCalledWith('tema/t1', { titulo: 'Tema', descripcion_titulo: 'NuxeoEnlace:uuid-subido' });
  });

  it('carga la descripción guardada en Nuxeo en el editor y, sin cambios, guarda el mismo enlace sin volver a subirla', async () => {
    component.temasData = [tema('t1', 'Tema que carga', 'NuxeoEnlace:uuid-ok')] as any;
    await component.construirFormulario();

    expect(component.temas.at(0).get('descripcion_titulo')?.value).toContain('<img');
    await component.guardarAspectos();

    expect(nuxeoService.guardarArchivos).not.toHaveBeenCalled();
    expect(planService.put).toHaveBeenCalledWith('tema/t1', { titulo: 'Tema que carga', descripcion_titulo: 'NuxeoEnlace:uuid-ok' });
  });

  it('si el gestor falla, muestra todos los temas, avisa y conserva el enlace al guardar', async () => {
    component.temasData = [
      tema('t1', 'Tema que carga', 'NuxeoEnlace:uuid-ok'),
      tema('t2', 'Tema con el gestor caído', 'NuxeoEnlace:uuid-caido', [{ _id: 's1', titulo: 'Subtema', activo: true }]),
    ] as any;
    await component.construirFormulario();

    expect(component.temas.controls.map((t) => t.get('nombre')?.value)).toEqual(['Tema que carga', 'Tema con el gestor caído']);
    expect(component.getSubtemas(1).length).toBe(1);
    expect(component.descripcionNoDisponible(component.temas.at(0))).toBe(false);
    expect(component.descripcionNoDisponible(component.temas.at(1))).toBe(true);
    expect(alertService.showAlert).toHaveBeenCalledWith('Descripción no disponible', expect.stringContaining('1 tema(s)'));

    await component.guardarAspectos();
    expect(planService.put).toHaveBeenCalledWith('tema/t2', { titulo: 'Tema con el gestor caído', descripcion_titulo: 'NuxeoEnlace:uuid-caido' });
  });
});
