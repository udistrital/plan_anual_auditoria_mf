import type { AccionGestion } from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import {
  botonAuditado,
  botonAuditor,
  porcentaje,
  textoVencimiento,
} from "./gestion-acciones.utilidades";

const accion = (extra: Partial<AccionGestion> = {}): AccionGestion => ({
  accion_id: "ac1", plan_mejoramiento_id: "p1", auditoria_id: "a1", no_auditoria: "1",
  nombre_auditoria: "Sistemas", tipo_evaluacion_nombre: "Auditoría Interna", no_hallazgo: "1.1.1",
  descripcion_hallazgo: "Hallazgo", no_accion: "2025-1.1", tipo_accion_nombre: "Correctiva",
  descripcion_accion: "Acción", dependencia_lider: "Oficina A", dependencias_apoyo: [],
  auditores_plan: [], fecha_inicio: null, fecha_fin: null, en_revision: false, total_soportes: 0,
  calificacion: null, fecha_calificacion: null, grupo: "PENDIENTE_HABILITAR", eficaz: false,
  en_riesgo: false, dias_para_vencer: null, auditor_plan_asignado: false, ...extra,
});

describe("botonAuditado", () => {
  it("con el cargue abierto ofrece Registrar Avances como botón primario", () => {
    const boton = botonAuditado(accion({ grupo: "CARGUE_ABIERTO" }));
    expect(boton.etiqueta).toBe("Registrar Avances");
    expect(boton.primario).toBe(true);
  });

  it("en una acción calificada ofrece Ver Calificación", () => {
    expect(botonAuditado(accion({ grupo: "CALIFICADAS" })).etiqueta).toBe("Ver Calificación");
  });

  it.each(["EN_REVISION", "PENDIENTE_HABILITAR"] as const)("en %s ofrece Ver Acción", (grupo) => {
    const boton = botonAuditado(accion({ grupo }));
    expect(boton.etiqueta).toBe("Ver Acción");
    expect(boton.primario).toBe(false);
  });
});

describe("botonAuditor", () => {
  it("el auditor del plan puede habilitar el cargue de una acción pendiente", () => {
    const boton = botonAuditor(accion({ grupo: "PENDIENTE_HABILITAR", auditor_plan_asignado: true }));
    expect(boton.etiqueta).toBe("Habilitar Cargue");
    expect(boton.primario).toBe(true);
  });

  it("el auditor del plan puede calificar una acción en revisión", () => {
    expect(botonAuditor(accion({ grupo: "EN_REVISION", auditor_plan_asignado: true })).etiqueta).toBe("Calificar");
  });

  it("quien no es auditor del plan solo ve la acción en revisión", () => {
    expect(botonAuditor(accion({ grupo: "EN_REVISION", auditor_plan_asignado: false })).etiqueta).toBe("Ver Acción");
  });

  it("en una acción calificada ofrece Ver Calificación", () => {
    expect(botonAuditor(accion({ grupo: "CALIFICADAS", auditor_plan_asignado: true })).etiqueta).toBe("Ver Calificación");
  });

  it("con el cargue abierto ofrece Ver Acción", () => {
    expect(botonAuditor(accion({ grupo: "CARGUE_ABIERTO", auditor_plan_asignado: true })).etiqueta).toBe("Ver Acción");
  });
});

describe("textoVencimiento", () => {
  it("es null sin fecha de fin", () => {
    expect(textoVencimiento(accion({ en_riesgo: true, dias_para_vencer: null }))).toBeNull();
  });

  it("indica que vence hoy", () => {
    expect(textoVencimiento(accion({ en_riesgo: true, dias_para_vencer: 0 }))?.texto).toBe("Vence hoy");
  });

  it("indica los días que faltan", () => {
    expect(textoVencimiento(accion({ en_riesgo: true, dias_para_vencer: 5 }))?.texto).toBe("Vence en 5 día(s)");
  });

  it("indica los días de vencida", () => {
    const vencimiento = textoVencimiento(accion({ en_riesgo: true, dias_para_vencer: -3 }));
    expect(vencimiento?.texto).toBe("Vencida hace 3 día(s)");
    expect(vencimiento?.clase).toBe("plazo-vencido");
  });

  it("es null si la acción no está en riesgo", () => {
    expect(textoVencimiento(accion({ en_riesgo: false, dias_para_vencer: 5 }))).toBeNull();
    expect(textoVencimiento(accion({ en_riesgo: false, dias_para_vencer: -3 }))).toBeNull();
  });
});

describe("porcentaje", () => {
  it("redondea a un decimal", () => {
    expect(porcentaje(11, 38)).toBe(28.9);
  });

  it("es 0 sin total", () => {
    expect(porcentaje(0, 0)).toBe(0);
  });
});
