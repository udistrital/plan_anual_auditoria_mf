import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { DescripcionHallazgoComponent } from './descripcion-hallazgo.component';

const base64 = (texto: string) => btoa(String.fromCharCode(...new TextEncoder().encode(texto)));

describe('DescripcionHallazgoComponent', () => {
  let nuxeoService: { obtenerPorUUID: jest.Mock };
  let component: DescripcionHallazgoComponent;

  const mostrar = async (valor: string | null | undefined) => {
    component.valor = valor;
    await component.ngOnChanges();
  };

  beforeEach(() => {
    nuxeoService = { obtenerPorUUID: jest.fn() };
    component = new DescripcionHallazgoComponent(nuxeoService as any);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('muestra texto plano y HTML sin consultar el gestor', async () => {
    await mostrar('Uno\nDos');
    expect(component.estado()).toBe('lista');
    expect(component.html()).toBe('<p>Uno</p><p>Dos</p>');

    await mostrar('<p>Rico</p>');
    expect(component.html()).toBe('<p>Rico</p>');
    expect(nuxeoService.obtenerPorUUID).not.toHaveBeenCalled();
  });

  it('descarga el enlace de Nuxeo', async () => {
    nuxeoService.obtenerPorUUID.mockResolvedValue(base64('<p><img src="x"></p>'));

    await mostrar('NuxeoEnlace:uuid-1');

    expect(nuxeoService.obtenerPorUUID).toHaveBeenCalledWith('uuid-1');
    expect(component.estado()).toBe('lista');
    expect(component.html()).toContain('<img');
  });

  it('marca el error si el gestor falla', async () => {
    nuxeoService.obtenerPorUUID.mockRejectedValue(new Error('404'));

    await mostrar('NuxeoEnlace:caido');

    expect(component.estado()).toBe('error');
  });

  it('marca como vacía una descripción sin contenido', async () => {
    await mostrar('<p><br></p>');
    expect(component.estado()).toBe('vacia');
  });

  it('descarta la respuesta de una descarga anterior', async () => {
    let resolverPrimera!: (valor: string) => void;
    nuxeoService.obtenerPorUUID.mockReturnValueOnce(new Promise((resolve) => { resolverPrimera = resolve; }));

    component.valor = 'NuxeoEnlace:lenta';
    const primera = component.ngOnChanges();
    await mostrar('<p>Más reciente</p>');
    resolverPrimera(base64('<p>Vieja</p>'));
    await primera;

    expect(component.html()).toBe('<p>Más reciente</p>');
  });

  it('el sanitizador conserva la imagen y su ancho, y elimina el código', async () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    nuxeoService.obtenerPorUUID.mockResolvedValue(base64(`<p class="ql-align-center"><img src="${png}" style="width: 300px;" onerror="alert(1)"></p><script>alert(2)</script>`));

    await mostrar('NuxeoEnlace:uuid-1');
    const limpio = TestBed.inject(DomSanitizer).sanitize(SecurityContext.HTML, component.html()) ?? '';

    expect(limpio).toContain(`src="${png}"`);
    expect(limpio).toContain('width="300px"');
    expect(limpio).toContain('ql-align-center');
    expect(limpio).not.toContain('onerror');
    expect(limpio).not.toContain('<script');
  });
});
