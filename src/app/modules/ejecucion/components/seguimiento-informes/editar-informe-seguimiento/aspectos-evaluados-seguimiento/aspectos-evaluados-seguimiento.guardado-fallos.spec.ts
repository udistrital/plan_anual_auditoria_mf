import { UntypedFormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AspectosEvaluadosSeguimientoComponent } from './aspectos-evaluados-seguimiento.component';

const HTML_CON_IMAGEN = '<p>Evidencia</p><p><img src="data:image/png;base64,iVBORw0KGgo="></p>';

describe('AspectosEvaluadosSeguimientoComponent - guardado sin éxito falso', () => {
  let component: AspectosEvaluadosSeguimientoComponent;
  let planService: { get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock };
  let alertService: { showAlert: jest.Mock; showConfirmAlert: jest.Mock; showErrorListAlert: jest.Mock };
  let nuxeoService: { obtenerPorUUID: jest.Mock; fileABase64: jest.Mock; guardarArchivos: jest.Mock };

  beforeEach(async () => {
    planService = {
      get: jest.fn(),
      post: jest.fn((coleccion: string) =>
        of(coleccion === 'tema' ? { Data: { _id: 'tema-nuevo' } } : { Data: { subtema: [{ _id: 'subtema-nuevo' }] } })),
      put: jest.fn(() => of({})),
      delete: jest.fn(),
    };
    alertService = { showAlert: jest.fn(), showConfirmAlert: jest.fn(), showErrorListAlert: jest.fn() };
    nuxeoService = {
      obtenerPorUUID: jest.fn(),
      fileABase64: jest.fn(() => Promise.resolve('aHRtbA==')),
      guardarArchivos: jest.fn(() => of([{ res: { Enlace: 'uuid-subido' } }])),
    };
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    component = new AspectosEvaluadosSeguimientoComponent(
      new UntypedFormBuilder(), planService as any, alertService as any, nuxeoService as any);
    component.informeId = 'informe-1';
    component.temasData = [];
    await component.construirFormulario();
  });

  afterEach(() => jest.restoreAllMocks());

  it('si falla la subida al gestor, informa el tema y la causa, no crea el tema ni sus subtemas y devuelve false', async () => {
    nuxeoService.guardarArchivos.mockReturnValue(throwError(() => new Error('CORS / 404 del gateway')));
    component.agregarTema();
    component.temas.at(0).patchValue({ nombre: 'Tema con imagen', descripcion_titulo: HTML_CON_IMAGEN });
    component.agregarSubtema(0);
    component.getSubtemas(0).at(0).patchValue({ nombre: 'Subtema 1' });

    const ok = await component.guardarAspectos();

    expect(ok).toBe(false);
    expect(planService.post).not.toHaveBeenCalled();
    expect(alertService.showErrorListAlert).toHaveBeenCalledWith(
      'No se guardó todo',
      expect.any(String),
      [expect.stringMatching(/Tema "Tema con imagen": no se pudo guardar la imagen .* gestor documental/)],
    );
    expect(alertService.showAlert).not.toHaveBeenCalledWith('Guardado exitoso', expect.anything());
  });

  it('si falla un subtema en el CRUD, el tema se guarda y el modal informa solo el subtema', async () => {
    planService.post.mockImplementation((coleccion: string) =>
      coleccion === 'subtema' ? throwError(() => new Error('500')) : of({ Data: { _id: 'tema-nuevo' } }));
    component.agregarTema();
    component.temas.at(0).patchValue({ nombre: 'Tema', descripcion_titulo: '<p>Texto</p>' });
    component.agregarSubtema(0);
    component.getSubtemas(0).at(0).patchValue({ nombre: 'Subtema que falla' });

    const ok = await component.guardarAspectos();

    expect(ok).toBe(false);
    expect(planService.post).toHaveBeenCalledWith('tema', expect.anything());
    const [, , detalles] = alertService.showErrorListAlert.mock.calls[0];
    expect(detalles).toEqual([expect.stringMatching(/Subtema "Subtema que falla": no se pudo crear en la base de datos/)]);
  });

  it('si todo se guarda, muestra "Guardado exitoso" y devuelve true', async () => {
    component.agregarTema();
    component.temas.at(0).patchValue({ nombre: 'Tema con imagen', descripcion_titulo: HTML_CON_IMAGEN });

    const ok = await component.guardarAspectos();

    expect(ok).toBe(true);
    expect(alertService.showErrorListAlert).not.toHaveBeenCalled();
    expect(alertService.showAlert).toHaveBeenCalledWith('Guardado exitoso', expect.any(String));
  });
});
