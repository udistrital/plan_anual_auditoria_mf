import {
  anioDeFecha,
  buscarHallazgoDuplicado,
  claveHallazgoExterno,
  HallazgoExterno,
  pendientesParaContinuar,
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

      expect(pendientes).toHaveLength(3);
    });

    it('exige el PDF aunque haya hallazgos', () => {
      expect(pendientesParaContinuar(crearRegistro({ informeFinal: null }))).toEqual([
        'Adjunte el informe final en formato PDF.',
      ]);
    });

    it('exige al menos un hallazgo', () => {
      expect(pendientesParaContinuar(crearRegistro({ hallazgos: [] }))).toEqual([
        'Registre al menos un hallazgo.',
      ]);
    });
  });
});
