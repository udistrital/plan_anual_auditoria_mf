# Plan de pruebas — Login por rol y navegación por fases

Issue: udistrital/sisifo_documentacion#939 · MF: plan_anual_auditoria_mf · Etiqueta: `@navegacion`

## Contexto

El root de SISIFO (core-mf) arma el menú lateral con las opciones que la configuración de roles le da al usuario y monta este MF bajo `/gestion-auditoria/`. Los escenarios inician sesión por WSO2 (global-setup) y recorren el menú como lo haría una persona.

Datos: no requieren datos propios. Solo lectura (`@lectura`).

## Escenarios

### 1. El auditor navega por las fases (`@auditor`)

Archivo: `tests/navegacion/fases-auditor.spec.ts`

1. Abrir el root con la sesión del auditor.
2. El menú muestra **Gestión de Auditoría** y **Planes de Mejoramiento**.
3. Para cada opción, navegar desde el menú y verificar la URL y el título de la pantalla:

| Menú | URL | Título |
|---|---|---|
| Gestión de Auditoría › Planeación › Auditorías Internas | `/gestion-auditoria/planeacion/auditorias-internas` | Auditorías internas |
| Gestión de Auditoría › Planeación › Seguimiento e Informes de Ley | `/gestion-auditoria/planeacion/seguimiento` | Planeación de Seguimientos e Informes de Ley |
| Gestión de Auditoría › Ejecución › Auditorías Internas | `/gestion-auditoria/ejecucion/auditorias-internas` | Auditorías internas |
| Gestión de Auditoría › Ejecución › Seguimiento e Informes de Ley | `/gestion-auditoria/ejecucion/seguimiento-informes` | Seguimiento e Informes |
| Planes de Mejoramiento › Asignar Planes | `/gestion-auditoria/plan-mejoramiento/asignar-auditores` | Asignar planes |
| Planes de Mejoramiento › Formulación de planes | `/gestion-auditoria/plan-mejoramiento` | Formulación de planes |
| Planes de Mejoramiento › Gestión de Acciones | `/gestion-auditoria/plan-mejoramiento/gestion-acciones` | Gestión de Acciones |

Resultado esperado: cada pantalla carga con su título, sin errores de JavaScript, y la corrida no hace escrituras.

### 2. El jefe de dependencia navega por las fases (`@jefe-dependencia`)

Archivo: `tests/navegacion/fases-jefe-dependencia.spec.ts`

Igual que el escenario 1, con las opciones del auditado: Planeación y Ejecución (las mismas cuatro), **Asignar Planes** y **Gestión de Acciones**.

Permiso: en **Planes de Mejoramiento** no aparece **Formulación de planes**.

## Fuera de este plan

- "Ejecución › Por definir" (auditor): apunta a otro MF (`/ejecucion-auditoria/...`).
- Jefe OCI y demás roles: sin usuario de prueba todavía.
