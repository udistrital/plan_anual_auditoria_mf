import { ClaseEstadoPipe } from "./clase-estado.pipe";

describe("ClaseEstadoPipe", () => {
  const pipe = new ClaseEstadoPipe();

  it.each([
    ["En Revisión Jefe", "estado-revision"],
    ["En revisión Secretario", "estado-revision"],
    ["Observaciones Preinforme Auditado", "estado-revision"],
    ["Rechazado", "estado-rechazado"],
    ["Rechazado Programa Jefe", "estado-rechazado"],
    ["Devuelto", "estado-rechazado"],
    ["Aprobado Secretario", "estado-aprobado"],
    ["Finalizado", "estado-aprobado"],
    ["Borrador", "estado-borrador"],
    ["Auditor Asignado", "estado-borrador"],
    ["Por Asignar", "estado-borrador"],
  ])("asigna a '%s' la clase %s", (estado, clase) => {
    expect(pipe.transform(estado)).toBe(clase);
  });

  it("trata un estado vacío como borrador", () => {
    expect(pipe.transform(undefined)).toBe("estado-borrador");
    expect(pipe.transform("")).toBe("estado-borrador");
  });
});
