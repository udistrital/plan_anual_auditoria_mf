import { UntypedFormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AspectosEvaluadosComponent } from './aspectos-evaluados.component';

const HTML_CON_IMAGEN = '<p>Evidencia</p><p><img src="data:image/png;base64,iVBORw0KGgo="></p>';
const base64 = (texto: string) => btoa(String.fromCharCode(...new TextEncoder().encode(texto)));

const hallazgo = (id: string, descripcion: string) => ({
  _id: id, titulo: `Hallazgo ${id}`, criterio: 'Criterio', activo: true, subtema_id: 's1', descripcion,
});

const temaConHallazgos = (hallazgos: any[]) => ({
  _id: 't1', titulo: 'Tema', activo: true, descripcion_titulo: '<p>Tema</p>',
  subtema: [{ _id: 's1', titulo: 'Subtema', activo: true, hallazgo: hallazgos }],
});

describe('AspectosEvaluadosComponent - descripción enriquecida del hallazgo', () => {
  let component: AspectosEvaluadosComponent;
  let planService: { get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock };
  let alertService: { showAlert: jest.Mock; showConfirmAlert: jest.Mock };
  let nuxeoService: { obtenerPorUUID: jest.Mock; fileABase64: jest.Mock; guardarArchivos: jest.Mock };

  const armar = async (hallazgos: any[]) => {
    component.temasData = [temaConHallazgos(hallazgos)] as any;
    await component.construirFormulario();
    alertService.showAlert.mockClear();
  };
  const controles = () => component.getHallazgos(0, 0);
  const descripcion = (indice: number) => controles().at(indice).get('descripcion')!;
  const putHallazgo = (id: string) => planService.put.mock.calls.find(([url]) => url === `hallazgo/${id}`)?.[1];

  beforeEach(() => {
    planService = { get: jest.fn(), post: jest.fn(() => of({ Data: { _id: 'nuevo' } })), put: jest.fn(() => of({})), delete: jest.fn() };
    alertService = { showAlert: jest.fn(), showConfirmAlert: jest.fn() };
    nuxeoService = {
      obtenerPorUUID: jest.fn((uuid: string) =>
        uuid === 'caido' ? Promise.reject(new Error('404')) : Promise.resolve(base64(HTML_CON_IMAGEN))),
      fileABase64: jest.fn().mockResolvedValue('Y29udGVuaWRv'),
      guardarArchivos: jest.fn(() => of([{ res: { Enlace: 'uuid-nuevo' } }])),
    };
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    component = new AspectosEvaluadosComponent(
      new UntypedFormBuilder(), planService as any, alertService as any, nuxeoService as any, {} as any);
    component.informeId = 'informe-1';
    component.auditoriaId = 'auditoria-1';
    component.ngOnInit();
  });

  afterEach(() => jest.restoreAllMocks());

  it('carga los tres formatos en el editor conservando los saltos de línea del texto heredado', async () => {
    await armar([hallazgo('h1', 'Línea uno\nLínea dos'), hallazgo('h2', '<p>Rico</p>'), hallazgo('h3', 'NuxeoEnlace:ok')]);

    expect(descripcion(0).value).toBe('<p>Línea uno</p><p>Línea dos</p>');
    expect(descripcion(1).value).toBe('<p>Rico</p>');
    expect(descripcion(2).value).toContain('<img');
  });

  it('un hallazgo sin editar conserva exactamente su valor guardado', async () => {
    await armar([hallazgo('h1', 'Texto heredado'), hallazgo('h2', 'NuxeoEnlace:ok')]);

    await expect(component.guardarAspectos()).resolves.toBe(true);

    expect(putHallazgo('h1').descripcion).toBe('Texto heredado');
    expect(putHallazgo('h2').descripcion).toBe('NuxeoEnlace:ok');
    expect(nuxeoService.guardarArchivos).not.toHaveBeenCalled();
  });

  it('guarda como HTML la edición sin imágenes', async () => {
    await armar([hallazgo('h1', 'Texto heredado')]);
    descripcion(0).setValue('<p><strong>Editado</strong></p>');

    await component.guardarAspectos();

    expect(putHallazgo('h1').descripcion).toBe('<p><strong>Editado</strong></p>');
    expect(nuxeoService.guardarArchivos).not.toHaveBeenCalled();
  });

  it('sube a Nuxeo la edición con imágenes y guarda el enlace', async () => {
    await armar([hallazgo('h1', 'Texto heredado')]);
    descripcion(0).setValue(HTML_CON_IMAGEN);

    await component.guardarAspectos();

    expect(nuxeoService.guardarArchivos).toHaveBeenCalledTimes(1);
    expect(putHallazgo('h1').descripcion).toBe('NuxeoEnlace:uuid-nuevo');
  });

  it('crea un hallazgo nuevo con imágenes usando el enlace', async () => {
    await armar([]);
    component.agregarHallazgo(0, 0);
    controles().at(0).patchValue({ criterio: 'C', hallazgo: 'H', descripcion: HTML_CON_IMAGEN });

    await component.guardarAspectos();

    expect(planService.post).toHaveBeenCalledWith('hallazgo', expect.objectContaining({ descripcion: 'NuxeoEnlace:uuid-nuevo' }));
  });

  it('rechaza una descripción sin contenido visible', async () => {
    await armar([hallazgo('h1', '<p>Texto</p>')]);
    descripcion(0).setValue('<p><br></p>');

    await expect(component.guardarAspectos()).resolves.toBe(false);

    expect(component.descripcionHallazgoInvalida(controles().at(0))).toBe(true);
    expect(planService.put).not.toHaveBeenCalled();
  });

  it('acepta una descripción que solo tiene una imagen', async () => {
    await armar([hallazgo('h1', '<p>Texto</p>')]);
    descripcion(0).setValue('<p><img src="data:image/png;base64,iVBORw0KGgo="></p>');

    await expect(component.guardarAspectos()).resolves.toBe(true);
  });

  it('con el gestor caído avisa, marca el hallazgo y conserva su enlace al guardar', async () => {
    component.temasData = [temaConHallazgos([hallazgo('h1', 'NuxeoEnlace:caido'), hallazgo('h2', '<p>Bien</p>')])] as any;
    await component.construirFormulario();

    expect(alertService.showAlert).toHaveBeenCalledWith('Descripción no disponible', expect.stringContaining('1 hallazgo(s)'));
    expect(controles().controls.map((c) => component.descripcionHallazgoNoDisponible(c))).toEqual([true, false]);

    await expect(component.guardarAspectos()).resolves.toBe(true);
    expect(putHallazgo('h1').descripcion).toBe('NuxeoEnlace:caido');
  });

  it('si falla la subida no escribe ese hallazgo, nombra el error y no avisa éxito', async () => {
    await armar([hallazgo('h1', 'Texto'), hallazgo('h2', 'Otro')]);
    descripcion(0).setValue(HTML_CON_IMAGEN);
    nuxeoService.guardarArchivos.mockReturnValue(throwError(() => new Error('Nuxeo caído')));
    const emitido = jest.fn();
    component.datosActualizados.subscribe(emitido);

    await expect(component.guardarAspectos()).resolves.toBe(false);

    expect(putHallazgo('h1')).toBeUndefined();
    expect(putHallazgo('h2')).toBeDefined();
    expect(descripcion(0).value).toBe(HTML_CON_IMAGEN);
    expect(alertService.showAlert).toHaveBeenCalledWith('Error', expect.stringContaining('Hallazgo h1'));
    expect(alertService.showAlert).not.toHaveBeenCalledWith('Guardado exitoso', expect.anything());
    expect(emitido).not.toHaveBeenCalled();
  });

  it('si Nuxeo no devuelve enlace se trata como una subida fallida', async () => {
    await armar([hallazgo('h1', 'Texto')]);
    descripcion(0).setValue(HTML_CON_IMAGEN);
    nuxeoService.guardarArchivos.mockReturnValue(of([{ res: {} }]));

    await expect(component.guardarAspectos()).resolves.toBe(false);
    expect(putHallazgo('h1')).toBeUndefined();
  });

  it('al reintentar tras fallar el PUT no vuelve a subir el documento', async () => {
    await armar([hallazgo('h1', 'Texto')]);
    descripcion(0).setValue(HTML_CON_IMAGEN);
    planService.put.mockImplementation((url: string) =>
      url === 'hallazgo/h1' ? throwError(() => new Error('CRUD caído')) : of({}));

    await expect(component.guardarAspectos()).resolves.toBe(false);

    planService.put.mockImplementation(() => of({}));
    await expect(component.guardarAspectos()).resolves.toBe(true);

    expect(nuxeoService.guardarArchivos).toHaveBeenCalledTimes(1);
    expect(putHallazgo('h1').descripcion).toBe('NuxeoEnlace:uuid-nuevo');
  });

  it('también devuelve false si falla un tema o un subtema', async () => {
    await armar([hallazgo('h1', 'Texto')]);
    planService.put.mockImplementation((url: string) =>
      url.startsWith('subtema/') ? throwError(() => new Error('CRUD caído')) : of({}));

    await expect(component.guardarAspectos()).resolves.toBe(false);
    expect(alertService.showAlert).toHaveBeenCalledWith('Error', expect.stringContaining('subtema "Subtema"'));
  });
});
