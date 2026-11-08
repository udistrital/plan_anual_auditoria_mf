import { UntypedFormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AspectosEvaluadosComponent } from './aspectos-evaluados.component';

const HTML_CON_IMAGEN = '<p>Evidencia</p><p><img src="data:image/png;base64,iVBORw0KGgo="></p>';

describe('AspectosEvaluadosComponent - guardado sin éxito falso', () => {
  let component: AspectosEvaluadosComponent;
  let planService: { get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock };
  let alertService: { showAlert: jest.Mock; showConfirmAlert: jest.Mock; showErrorListAlert: jest.Mock };
  let nuxeoService: { obtenerPorUUID: jest.Mock; fileABase64: jest.Mock; guardarArchivos: jest.Mock };
  let datosActualizados: jest.Mock;

  const temaNuevo = (nombre: string, descripcion: string) => {
    component.agregarTema();
    component.temas.at(component.temas.length - 1).patchValue({ nombre, descripcion_titulo: descripcion });
  };

  beforeEach(async () => {
    planService = {
      get: jest.fn(),
      post: jest.fn(() => of({ Data: { _id: 'tema-nuevo' } })),
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

    component = new AspectosEvaluadosComponent(
      new UntypedFormBuilder(), planService as any, alertService as any, nuxeoService as any, {} as any);
    component.informeId = 'informe-1';
    component.temasData = [];
    await component.construirFormulario();
    datosActualizados = jest.fn();
    component.datosActualizados.subscribe(datosActualizados);
  });

  afterEach(() => jest.restoreAllMocks());

  it('si falla la subida al gestor, informa el tema y la causa, no crea el tema y no muestra "Guardado exitoso"', async () => {
    nuxeoService.guardarArchivos.mockReturnValue(throwError(() => new Error('CORS / 404 del gateway')));
    temaNuevo('Tema con imagen', HTML_CON_IMAGEN);

    const ok = await component.guardarAspectos();

    expect(ok).toBe(false);
    expect(planService.post).not.toHaveBeenCalled();
    expect(alertService.showErrorListAlert).toHaveBeenCalledWith(
      'No se guardó todo',
      expect.any(String),
      [expect.stringMatching(/Tema "Tema con imagen": no se pudo guardar la imagen .* gestor documental/)],
    );
    expect(alertService.showAlert).not.toHaveBeenCalledWith('Guardado exitoso', expect.anything());
    expect(datosActualizados).not.toHaveBeenCalled();
    // Lo escrito sigue en el formulario para reintentarlo
    expect(component.temas.at(0).get('nombre')?.value).toBe('Tema con imagen');
  });

  it('si el CRUD falla, informa que no se guardó en la base de datos y guarda los demás temas', async () => {
    planService.post.mockImplementation((_coleccion: string, body: any) =>
      body.titulo === 'Tema que falla' ? throwError(() => new Error('500')) : of({ Data: { _id: 'tema-ok' } }));
    temaNuevo('Tema que falla', '<p>Solo texto</p>');
    temaNuevo('Tema que se guarda', '<p>Solo texto</p>');

    const ok = await component.guardarAspectos();

    expect(ok).toBe(false);
    expect(planService.post).toHaveBeenCalledWith('tema', expect.objectContaining({ titulo: 'Tema que se guarda' }));
    const [, , detalles] = alertService.showErrorListAlert.mock.calls[0];
    expect(detalles).toEqual([expect.stringMatching(/Tema "Tema que falla": no se pudo crear en la base de datos/)]);
  });

  it('si un tema existente no puede subir su nueva imagen, no se actualiza y conserva su versión anterior', async () => {
    component.temasData = [{ _id: 't1', titulo: 'Tema existente', activo: true, descripcion_titulo: '<p>Antes</p>', subtema: [] }] as any;
    await component.construirFormulario();
    nuxeoService.guardarArchivos.mockReturnValue(throwError(() => new Error('gestor caído')));
    component.temas.at(0).patchValue({ descripcion_titulo: HTML_CON_IMAGEN });

    const ok = await component.guardarAspectos();

    expect(ok).toBe(false);
    expect(planService.put).not.toHaveBeenCalledWith('tema/t1', expect.anything());
    const [, , detalles] = alertService.showErrorListAlert.mock.calls[0];
    expect(detalles[0]).toMatch(/conserva su versión anterior/);
  });

  it('si todo se guarda, muestra "Guardado exitoso" y avisa al padre', async () => {
    temaNuevo('Tema con imagen', HTML_CON_IMAGEN);

    const ok = await component.guardarAspectos();

    expect(ok).toBe(true);
    expect(planService.post).toHaveBeenCalledWith('tema', expect.objectContaining({ descripcion_titulo: 'NuxeoEnlace:uuid-subido' }));
    expect(alertService.showErrorListAlert).not.toHaveBeenCalled();
    expect(alertService.showAlert).toHaveBeenCalledWith('Guardado exitoso', expect.any(String));
    expect(datosActualizados).toHaveBeenCalledTimes(1);
  });
});
