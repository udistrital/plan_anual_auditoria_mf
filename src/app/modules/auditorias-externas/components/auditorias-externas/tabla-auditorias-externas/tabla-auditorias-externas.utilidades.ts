import { AuditoriaExterna } from "src/app/shared/data/models/auditoria-externa";

export const colocacionesContructorTabla = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (auditoria: AuditoriaExterna) => "",
    sortable: false,
  },
  {
    columnDef: "vigencia",
    header: "Vigencia",
    cell: (auditoria: AuditoriaExterna) => auditoria.vigencia_nombre,
    sortable: false,
  },
  {
    columnDef: "entidad",
    header: "Entidad",
    cell: (auditoria: AuditoriaExterna) =>
      `${auditoria.codigo_entidad} - ${auditoria.nombre_entidad}`,
    sortable: false,
  },
  {
    columnDef: "auditoria",
    header: "Auditoria",
    cell: (auditoria: AuditoriaExterna) => auditoria.nombre_auditoria,
    sortable: false,
  },
  {
    columnDef: "fecha",
    header: "Fecha del informe final",
    cell: (auditoria: AuditoriaExterna) =>
      auditoria.fecha_informe_final
        ? new Date(auditoria.fecha_informe_final).toLocaleDateString("es-CO", { timeZone: "UTC" })
        : "",
    sortable: false,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (auditoria: AuditoriaExterna) => "",
    sortable: false,
  },
];
