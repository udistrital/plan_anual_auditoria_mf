import {
  anioDeFecha,
  buscarHallazgoDuplicado,
  claveHallazgoExterno,
  combinarHallazgos,
  extraerErroresCargue,
  HallazgoExterno,
  pendientesParaContinuar,
  mensajesErrorRegistro,
  armarCuerpoRegistro,
  RegistroAuditoriaExterna,
} from './registro-auditoria-externa';

const crearHallazgo = (datos: Partial<HallazgoExterno> = {}): HallazgoExterno => ({
  vigencia_pad: 2025,
  vigencia_nombre: '2025',
  codigo_auditoria_pad: 'PAD-1',
  numeral: '3.1',
  descripcion: 'Deficiencias en la supervisión del contrato',
  dependencia_id: [32],
  dependencias_nombre: ['Oficina de Control Interno'],
  ...datos,
});

const crearRegistro = (
  datos: Partial<RegistroAuditoriaExterna> = {},
): RegistroAuditoriaExterna => ({
  datosGenerales: {
    codigo_entidad: '123',
    nombre_entidad: 'Contraloría de Bogotá',
    nombre_auditoria: 'Auditoría de cumplimiento',
    fecha_informe_final: '2025-11-05T05:00:00.000Z',
    vigencia_id: 7000,
  },
  hallazgos: [crearHallazgo()],
  informeFinal: { nombre: 'informe.pdf', base64: 'JVBERi0=', tamanio: 1024 },
  ...datos,
});

describe('registro-auditoria-externa', () => {
  describe('claveHallazgoExterno', () => {
    it('ignora mayúsculas y espacios en los extremos', () => {
      expect(
        claveHallazgoExterno({ codigo_auditoria_pad: '  PAD-1 ', numeral: ' A.1' }),
      ).toBe('pad-1|a.1');
    });
  });

  describe('buscarHallazgoDuplicado', () => {
    const lista = [
      crearHallazgo({ numeral: '1' }),
      crearHallazgo({ numeral: '2' }),
    ];

    it('devuelve el índice del hallazgo repetido', () => {
      expect(
        buscarHallazgoDuplicado(lista, {
          codigo_auditoria_pad: 'pad-1',
          numeral: '2',
        }),
      ).toBe(1);
    });

    it('devuelve -1 si el número no existe', () => {
      expect(
        buscarHallazgoDuplicado(lista, {
          codigo_auditoria_pad: 'PAD-1',
          numeral: '9',
        }),
      ).toBe(-1);
    });

    it('permite conservar la clave al editar el mismo hallazgo', () => {
      expect(
        buscarHallazgoDuplicado(
          lista,
          { codigo_auditoria_pad: 'PAD-1', numeral: '1' },
          0,
        ),
      ).toBe(-1);
    });

    it('detecta el choque al editar con la clave de otro hallazgo', () => {
      expect(
        buscarHallazgoDuplicado(
          lista,
          { codigo_auditoria_pad: 'PAD-1', numeral: '2' },
          0,
        ),
      ).toBe(1);
    });
  });

  describe('combinarHallazgos', () => {
    const existentes = [crearHallazgo({ numeral: '1' }), crearHallazgo({ numeral: '2' })];

    it('suma los hallazgos del archivo a los existentes y quita la fila del archivo', () => {
      const { hallazgos, errores } = combinarHallazgos(existentes, [
        { ...crearHallazgo({ numeral: '3' }), fila: 2 },
        { ...crearHallazgo({ numeral: '4' }), fila: 3 },
      ]);

      expect(errores).toEqual([]);
      expect(hallazgos.map((h) => h.numeral)).toEqual(['1', '2', '3', '4']);
      expect(hallazgos.some((h) => 'fila' in h)).toBe(false);
    });

    it('no agrega nada si alguno repite un hallazgo ya registrado (todo o nada)', () => {
      const { hallazgos, errores } = combinarHallazgos(existentes, [
        { ...crearHallazgo({ numeral: '3' }), fila: 2 },
        { ...crearHallazgo({ numeral: '2' }), fila: 5 },
      ]);

      expect(hallazgos).toBe(existentes);
      expect(errores).toEqual([
        {
          fila: 5,
          columna: 'No. Hallazgo',
          motivo:
            'El hallazgo "2" de la auditoría "PAD-1" ya está registrado (hallazgo 2 de la lista).',
        },
      ]);
    });

    it('rechaza el archivo si junto a lo registrado supera el máximo', () => {
      const { hallazgos, errores } = combinarHallazgos(
        existentes,
        [crearHallazgo({ numeral: '3' })],
        2,
      );

      expect(hallazgos).toBe(existentes);
      expect(errores).toHaveLength(1);
      expect(errores[0]).toMatchObject({ fila: 0, columna: 'Archivo' });
    });
  });

  describe('extraerErroresCargue', () => {
    it('lee los errores por fila y el mensaje del filtro de errores del MID', () => {
      const resultado = extraerErroresCargue({
        status: 400,
        error: {
          status: 400,
          message: 'El archivo contiene errores.',
          details: {
            errores: [{ fila: 3, columna: 'Vigencia', motivo: 'La vigencia "1999" no existe.' }],
          },
        },
      });

      expect(resultado.mensaje).toBe('El archivo contiene errores.');
      expect(resultado.errores).toEqual([
        { fila: 3, columna: 'Vigencia', motivo: 'La vigencia "1999" no existe.' },
      ]);
    });

    it('sin errores por fila devuelve solo el mensaje (archivo no válido, columnas faltantes)', () => {
      const resultado = extraerErroresCargue({
        error: { message: 'El archivo no es un Excel (.xlsx) válido.', details: {} },
      });

      expect(resultado.errores).toEqual([]);
      expect(resultado.mensaje).toBe('El archivo no es un Excel (.xlsx) válido.');
    });

    it('usa un mensaje genérico si no hay respuesta del servidor', () => {
      expect(extraerErroresCargue(undefined)).toEqual({
        mensaje: 'No fue posible validar el archivo. Intente de nuevo.',
        errores: [],
      });
    });
  });

  describe('anioDeFecha', () => {
    it('lee el año de un Date y de un texto ISO', () => {
      expect(anioDeFecha(new Date(2025, 5, 1))).toBe(2025);
      expect(anioDeFecha('2024-11-05T12:00:00.000Z')).toBe(2024);
    });

    it('devuelve null si no hay fecha válida', () => {
      expect(anioDeFecha(null)).toBeNull();
      expect(anioDeFecha('')).toBeNull();
      expect(anioDeFecha('no es fecha')).toBeNull();
    });
  });

  describe('pendientesParaContinuar', () => {
    it('no deja pendientes cuando el registro está completo', () => {
      expect(pendientesParaContinuar(crearRegistro())).toEqual([]);
    });

    it('lista todo lo que falta, sin detenerse en lo primero', () => {
      const pendientes = pendientesParaContinuar(
        crearRegistro({ datosGenerales: null, hallazgos: [], informeFinal: null }),
      );

      expect(pendientes.map((p) => p.seccion)).toEqual(['informacion', 'informe', 'hallazgos']);
    });

    it('exige el PDF aunque haya hallazgos', () => {
      expect(pendientesParaContinuar(crearRegistro({ informeFinal: null }))).toEqual([
        { seccion: 'informe', mensaje: 'Adjunte el informe final en formato PDF.' },
      ]);
    });

    it('exige al menos un hallazgo', () => {
      expect(pendientesParaContinuar(crearRegistro({ hallazgos: [] }))).toEqual([
        { seccion: 'hallazgos', mensaje: 'Registre al menos un hallazgo.' },
      ]);
    });
  });

  describe('mensajesErrorRegistro', () => {
    it('lista cada error de validación, con el número de hallazgo cuando aplica', () => {
      const mensajes = mensajesErrorRegistro({
        status: 400,
        error: {
          details: {
            errores: [
              { fila: 0, campo: 'documento', motivo: 'Debe adjuntar el informe final en PDF.' },
              { fila: 2, campo: 'numeral', motivo: 'El hallazgo "3.1" ya está en la fila 1.' },
            ],
          },
        },
      });

      expect(mensajes).toEqual([
        'Debe adjuntar el informe final en PDF.',
        'Hallazgo 2: El hallazgo "3.1" ya está en la fila 1.',
      ]);
    });

    it('explica el 403, el 409 con el mensaje del servidor y el 502', () => {
      expect(mensajesErrorRegistro({ status: 403, error: {} })).toEqual([
        'Su rol no permite registrar auditorías externas.',
      ]);
      expect(
        mensajesErrorRegistro({ status: 409, error: { message: 'Ya existe una auditoría externa' } }),
      ).toEqual(['Ya existe una auditoría externa']);
      expect(mensajesErrorRegistro({ status: 502, error: {} })[0]).toContain('no se guardó nada');
    });

    it('da un mensaje genérico ante cualquier otro fallo (sin detalles internos)', () => {
      expect(mensajesErrorRegistro(new Error('Network down'))).toEqual([
        'No fue posible registrar la auditoría externa. Intente de nuevo.',
      ]);
      expect(mensajesErrorRegistro({ status: 500, error: { message: 'stack interno' } })[0]).not.toContain(
        'stack',
      );
    });
  });

  describe('armarCuerpoRegistro', () => {
    it('envía solo lo que el MID espera, sin los nombres ni el PDF en Base64', () => {
      const registro = crearRegistro();

      const cuerpo = armarCuerpoRegistro(
        registro,
        { nuxeo_id: 55, nuxeo_enlace: 'https://nuxeo/doc' },
        { id: 101, rol: 'AUDITOR' },
      );

      expect(cuerpo.documento).toEqual({ nuxeo_id: 55, nuxeo_enlace: 'https://nuxeo/doc' });
      expect(cuerpo.usuario_id).toBe(101);
      expect(cuerpo.usuario_rol).toBe('AUDITOR');
      expect(cuerpo.vigencia_id).toBe(registro.datosGenerales!.vigencia_id);
      expect(Object.keys(cuerpo.hallazgos[0]).sort()).toEqual([
        'codigo_auditoria_pad',
        'dependencia_id',
        'descripcion',
        'numeral',
        'vigencia_pad',
      ]);
      expect(JSON.stringify(cuerpo)).not.toContain(registro.informeFinal!.base64);
    });
  });
});
