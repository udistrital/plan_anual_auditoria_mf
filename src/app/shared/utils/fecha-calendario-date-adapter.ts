import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";
import { parsearFechaCalendario } from "./fecha-calendario.util";

/**
 * Adaptador de fechas para los datepickers de Material.
 *
 * El NativeDateAdapter convierte los textos ISO con `new Date(texto)`. Una fecha guardada a
 * medianoche UTC ("2026-11-26T00:00:00Z") queda entonces como el 25/11 a las 7:00 p. m. en
 * Colombia, y el datepicker muestra el día anterior. Este adaptador interpreta esos textos
 * como fechas de calendario (ver fecha-calendario.util.ts).
 */
@Injectable()
export class FechaCalendarioDateAdapter extends NativeDateAdapter {
  override deserialize(value: any): Date | null {
    if (typeof value === "string" && value) {
      const fecha = parsearFechaCalendario(value);
      if (fecha) return fecha;
    }
    return super.deserialize(value);
  }
}
