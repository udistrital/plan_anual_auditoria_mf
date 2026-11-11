import { TablaHallazgosComponent } from './tabla-hallazgos.component';

describe('TablaHallazgosComponent - columna "Descripción del Hallazgo"', () => {
  const fila = { hallazgoTitulo: 'Título del hallazgo', hallazgoDescripcion: '<p>Descripción completa</p>' };

  const columnaDescripcion = (vistaDictamen: boolean) => {
    const component = new (TablaHallazgosComponent as any)({}, {}, {}, {}, {}, {}, {}, {}, {});
    component.vistaDictamen = vistaDictamen;
    component['construirColumnas']();
    return component.constructorTabla.find((c: any) => c.columnDef === 'descripcion');
  };

  it('en Ver Plan muestra el título del hallazgo', () => {
    expect(columnaDescripcion(true).cell(fila)).toBe('Título del hallazgo');
  });

  it('en Registrar Plan sigue mostrando la descripción en texto', () => {
    expect(columnaDescripcion(false).cell(fila)).toBe('Descripción completa');
  });

  it('el título no altera los datos que usan los modales', () => {
    columnaDescripcion(true);
    expect(fila.hallazgoDescripcion).toBe('<p>Descripción completa</p>');
  });
});
