import { DescripcionTextoPipe } from './descripcion-texto.pipe';

describe('DescripcionTextoPipe', () => {
  const pipe = new DescripcionTextoPipe();

  it('nunca muestra etiquetas ni el enlace de Nuxeo', () => {
    expect(pipe.transform('<p><strong>Rezago</strong></p>')).toBe('Rezago');
    expect(pipe.transform('NuxeoEnlace:123')).toBe('(Contenido con imágenes)');
    expect(pipe.transform('Texto plano')).toBe('Texto plano');
    expect(pipe.transform(undefined)).toBe('');
  });
});
