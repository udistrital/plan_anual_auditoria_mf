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

### 3–6. Programación por rol (`@auditor-experto`, `@jefe-oci`, `@secretario`, `@admin`)

Archivos: `tests/navegacion/fases-{auditor-experto,jefe-oci,secretario,admin}.spec.ts`

1. Abrir el root con la sesión del rol.
2. El menú de primer nivel es el del rol:

| Rol | Menú de primer nivel | Gestión de Auditoría › Programación |
|---|---|---|
| Auditor experto (AUDITOR_EXPERTO) | Gestión de Auditoría, Gestión de Usuarios, Planes de Mejoramiento | Plan Anual de Auditoría, Asignar Auditorías, Registro Auditorías Especiales |
| Jefe OCI (JEFE_CONTROL_INTERNO) | Gestión de Auditoría, Gestión de Usuarios | Plan Anual de Auditoría |
| Secretario (SECRETARIO_AUDITOR + AUDITOR) | Gestión de Auditoría, Planes de Mejoramiento | Plan Anual de Auditoría |
| Administrador (ADMIN_SISIFO) | Gestión de Auditoría, Gestión de Usuarios, Planes de Mejoramiento | Plan Anual de Auditoría, Asignar Auditorías, Registro Auditorías Especiales |

Las cuentas de prueba de cada rol solo están en `e2e/.env.e2e` (no versionado): se piden a quien las administra.

3. Navegar a cada opción de Programación del rol y verificar la URL y el título:

| Menú | URL | Título |
|---|---|---|
| Gestión de Auditoría › Programación › Plan Anual de Auditoría | `/gestion-auditoria/programacion/plan-auditoria` | Plan Anual de Auditorías (PAA) |
| Gestión de Auditoría › Programación › Asignar Auditorías | `/gestion-auditoria/programacion/asignar-auditorias` | Asignar Auditorías del Plan Anual de Auditorías (PAA) |
| Gestión de Auditoría › Programación › Registro Auditorías Especiales | `/gestion-auditoria/programacion/auditorias-especiales` | Registro Auditorías Especiales |

Permiso: el Jefe OCI y el Secretario **no** ven Asignar Auditorías ni Registro Auditorías Especiales (crear y asignar es de `ROLES_CREACION.PROGRAMACION` = ADMIN_SISIFO y AUDITOR_EXPERTO).

## Fuera de este plan

- "Ejecución › Por definir" (auditor): apunta a otro MF (`/ejecucion-auditoria/...`).
- Planeación, Ejecución y Planes de Mejoramiento con los roles de Programación: fuera del alcance de la fase 1 (sisifo_documentacion#939, etapa 2).
- Gestión de Usuarios: es de `usuario_rol_mf`.
