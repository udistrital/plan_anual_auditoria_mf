import {
  descripcionAHtml,
  descripcionATexto,
  esHtml,
  esHtmlVacio,
  htmlATexto,
  textoPlanoAHtml,
  TEXTO_CONTENIDO_CON_IMAGENES,
} from './html.util';

describe('esHtmlVacio', () => {
  it('considera vacíos null, undefined y cadena vacía', () => {
    expect(esHtmlVacio(null)).toBe(true);
    expect(esHtmlVacio(undefined)).toBe(true);
    expect(esHtmlVacio('')).toBe(true);
  });

  it('considera vacío el HTML de Quill sin texto', () => {
    expect(esHtmlVacio('<p><br></p>')).toBe(true);
    expect(esHtmlVacio('<p>&nbsp;</p><p>  </p>')).toBe(true);
  });

  it('detecta contenido de texto', () => {
    expect(esHtmlVacio('<p>Texto</p>')).toBe(false);
  });

  it('detecta imágenes aunque no haya texto', () => {
    expect(esHtmlVacio('<p><img src="x"></p>')).toBe(false);
  });

  it('no considera vacío un enlace de Nuxeo', () => {
    expect(esHtmlVacio('NuxeoEnlace:123')).toBe(false);
  });
});

describe('esHtml', () => {
  it('reconoce el HTML de Quill y no el texto plano', () => {
    expect(esHtml('<p>Texto</p>')).toBe(true);
    expect(esHtml('<ol><li>Uno</li></ol>')).toBe(true);
    expect(esHtml('El valor <p> va al final')).toBe(false);
    expect(esHtml('Texto plano')).toBe(false);
    expect(esHtml(null)).toBe(false);
  });
});

describe('textoPlanoAHtml', () => {
  it('conserva los saltos de línea y las líneas en blanco', () => {
    expect(textoPlanoAHtml('Uno\n\nDos\r\nTres')).toBe('<p>Uno</p><p><br></p><p>Dos</p><p>Tres</p>');
  });

  it('escapa los caracteres de HTML', () => {
    expect(textoPlanoAHtml('a < b & <script>')).toBe('<p>a &lt; b &amp; &lt;script&gt;</p>');
  });

  it('devuelve vacío si no hay texto', () => {
    expect(textoPlanoAHtml('  \n ')).toBe('');
    expect(textoPlanoAHtml(null)).toBe('');
  });
});

describe('htmlATexto', () => {
  it('quita etiquetas y deja una línea por bloque', () => {
    expect(htmlATexto('<p><strong>Uno</strong>&nbsp;dos</p><ol><li>Tres</li><li>Cuatro</li></ol>')).toBe('Uno dos\nTres\nCuatro');
  });

  it('decodifica entidades y no ejecuta el contenido', () => {
    (window as any).__xss = false;
    expect(htmlATexto('<p>a &lt; b</p><img src=x onerror="window.__xss=true">')).toBe('a < b');
    expect((window as any).__xss).toBe(false);
  });
});

describe('descripcionATexto', () => {
  it('resuelve los tres formatos sin consultar el gestor', () => {
    expect(descripcionATexto('Texto\nplano')).toBe('Texto\nplano');
    expect(descripcionATexto('<p>Texto</p>')).toBe('Texto');
    expect(descripcionATexto('NuxeoEnlace:123')).toBe(TEXTO_CONTENIDO_CON_IMAGENES);
    expect(descripcionATexto(null)).toBe('');
  });

  it('usa el marcador si un HTML solo tiene imágenes', () => {
    expect(descripcionATexto('<p><img src="x"></p>')).toBe(TEXTO_CONTENIDO_CON_IMAGENES);
  });
});

describe('descripcionAHtml', () => {
  const base64 = (texto: string) => btoa(String.fromCharCode(...new TextEncoder().encode(texto)));

  it('convierte texto plano y deja igual el HTML, sin consultar el gestor', async () => {
    const obtener = jest.fn();
    await expect(descripcionAHtml('Uno\nDos', obtener)).resolves.toBe('<p>Uno</p><p>Dos</p>');
    await expect(descripcionAHtml('<p>Uno</p>', obtener)).resolves.toBe('<p>Uno</p>');
    expect(obtener).not.toHaveBeenCalled();
  });

  it('descarga el enlace, conserva tildes y pasa el ancho de la imagen a atributo', async () => {
    const obtener = jest.fn().mockResolvedValue(base64('<p>Evaluación</p><img src="x" style="width: 300px;">'));

    await expect(descripcionAHtml('NuxeoEnlace:uuid-1', obtener)).resolves.toBe('<p>Evaluación</p><img src="x" width="300px">');
    expect(obtener).toHaveBeenCalledWith('uuid-1');
  });

  it('propaga el error del gestor', async () => {
    await expect(descripcionAHtml('NuxeoEnlace:x', jest.fn().mockRejectedValue(new Error('404')))).rejects.toThrow('404');
  });
});
