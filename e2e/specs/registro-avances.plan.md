# Plan de pruebas — Registro de avances y calificación

Issue: udistrital/sisifo_documentacion#939 (migra las verificaciones de #924 y #925) · MF: plan_anual_auditoria_mf · Etiqueta: `@plan-mejoramiento`

## Contexto

En **Planes de Mejoramiento › Gestión de Acciones**, cada acción de un plan aprobado se abre en una de dos variantes:

- **Auditado** (jefe o asistente de la dependencia): opción **Registrar Avances**, ruta `/registrar-avances/:id`. Sube evidencias y consulta la calificación.
- **Auditor asignado al plan**: opción **Revisar y calificar**, ruta `/revisar/:id`. Habilita o bloquea el cargue y califica.

## Datos semilla

- Vigencia `2026` (`E2E_VIGENCIA`) con acciones de planes aprobados en el ambiente de pruebas.
- Se usa la primera acción del listado, o la de `E2E_ACCION_ID`. El usuario de prueba del auditor está asignado al plan de esa acción.
- Ningún escenario crea ni modifica datos. Todos son `@lectura`: el fixture aborta cualquier escritura.

## Escenarios

### 1. El auditado consulta el registro de avances (`@jefe-dependencia`)

Archivo: `tests/plan-mejoramiento/registro-avances-auditado.spec.ts`

1. Entrar desde el listado: la opción de la fila es **Registrar Avances** y abre `/registrar-avances/:id`.
2. Ve **Evidencias de avance** y **Calificación de Control Interno**. No ve el formulario de calificación ni el botón de cargue del auditor. No hay stepper.
3. El chip indica el estado del cargue, y **Añadir documento** está presente.
4. **Ficha de la acción** abre el panel en la pestaña **Acción**. Con la flecha derecha recorre Hallazgo → Auditoría → Responsables → Acción, y con Esc se cierra.
5. **Ver hallazgo** abre el panel directamente en **Hallazgo**.
6. A 390 px de ancho no hay desborde horizontal.

### 2. El auditor revisa y valida el formulario de calificación (`@auditor`)

Archivo: `tests/plan-mejoramiento/calificacion-auditor.spec.ts`

1. Entrar desde el listado: la opción es **Revisar y calificar** y abre `/revisar/:id`.
2. Ve **Evidencias de la dependencia**, el botón de cargue y **Calificación del auditor**.
3. Abre el formulario (con **Nueva calificación** si ya hay una vigente).
4. **Calificar** con el formulario vacío muestra 3 errores y pone el foco en **Porcentaje de avance**.
5. Con 60 % se sugiere el criterio **En progreso**.
6. Al elegir **Satisfactorio** aparece el aviso de diferencia con el criterio sugerido.
7. Al escribir el análisis desaparecen los errores.
8. **Calificar** pide confirmación; se cancela y no se registra nada.

### 3. Una corrida de lectura no puede escribir (`@auditor`)

Archivo: `tests/plan-mejoramiento/bloqueo-escrituras.spec.ts`

1. El auditor pulsa el botón de cargue (bloquear o habilitar) y confirma.
2. El fixture aborta el `PUT accion-mejora/:id`, y la aplicación informa que no pudo actualizar el estado del cargue.
3. Al recargar, el estado del cargue no cambió.

Esto demuestra la garantía del marco: los escenarios `@lectura` corren en el ambiente compartido sin modificar datos.

### 4. Acción sin calificaciones (`@jefe-dependencia`, `@simulado`)

Archivo: `tests/plan-mejoramiento/sin-calificaciones-auditado.spec.ts`

1. Se simula que `calificacion-accion` responde vacío (`simularGet`).
2. El auditado ve "El auditor aún no ha calificado esta acción." y no aparece el botón **Historial**.

No prueba el backend: muestra cómo preparar un estado sin escribir datos.

## Fuera de este plan

- Subir y guardar un PDF, guardar la calificación y bloquear el cargue de verdad: son `@escritura` y quedan para el CRUD local con limpieza.
- Foro: está en construcción (datos de ejemplo).
