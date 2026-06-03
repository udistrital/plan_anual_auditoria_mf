/**
 * Numeración jerárquica de hallazgos: {tema}.{subtema}.{hallazgo}.
 */
export interface HallazgoNumerado {
  hallazgoId: string;
  numero: string;
  hallazgo: any;
}

export function numerarHallazgos(
  temas: any[],
  hallazgos: any[],
): HallazgoNumerado[] {
  const resultado: HallazgoNumerado[] = [];
  let temaCount = 0;

  for (const tema of temas ?? []) {
    if (!tema.activo) continue;
    temaCount++;
    let subtemaCount = 0;

    for (const subtema of tema.subtema ?? []) {
      if (!subtema.activo) continue;
      subtemaCount++;
      let hallazgoCount = 0;

      const subtemaIdStr = subtema._id?.toString();
      for (const h of (hallazgos ?? []).filter(
        (h) =>
          h.subtema_id?.toString() === subtemaIdStr && h.activo !== false,
      )) {
        hallazgoCount++;
        resultado.push({
          hallazgoId: h._id?.toString(),
          numero: `${temaCount + 1}.${subtemaCount}.${hallazgoCount}`,
          hallazgo: h,
        });
      }
    }
  }

  return resultado;
}
