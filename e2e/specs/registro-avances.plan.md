# Plan de pruebas — Registro de avances y calificación

Issue: udistrital/sisifo_documentacion#939 (migra las verificaciones de #924 y #925) · MF: plan_anual_auditoria_mf · Etiqueta: `@plan-mejoramiento`

## Contexto

En **Planes de Mejoramiento › Gestión de Acciones**, cada acción de un plan aprobado se abre en una de dos variantes:

Desde #916 (Sgarcia8, vistas por rol, en develop desde el 27/10/2026) el menú de la fila depende del rol y del estado, y todas las opciones abren `/registrar-avances/:id`; la variante la decide el rol:

- **Auditado** (jefe o asistente de la dependencia): solo ve las acciones de las que es **responsable**. Opción **Registrar Avances** con el cargue abierto; **Ver Calificación** o **Ver Acción** en los demás estados. Sube evidencias y consulta la calificación.
- **Auditor asignado al plan**: **Habilitar Cargue** (pendiente de habilitar) o **Calificar** (en revisión OCI); en los demás estados, **Ver Acción** o **Ver Calificación**. Habilita o bloquea el cargue y califica.

La ruta `/revisar/:id` sigue existiendo y se usa solo con `E2E_ACCION_ID`.

## Datos semilla

- Se busca en la vigencia `2026` (`E2E_VIGENCIA`) y, si el rol no tiene acciones allí, en las 5 anteriores.
- Se usa la primera acción cuya opción principal es la de la variante (en orden de preferencia), o la de `E2E_ACCION_ID`.
- En pruebas (05/11/2026) la cuenta del jefe de dependencia es responsable de una sola acción, de una vigencia anterior y pendiente de habilitar (opción **Ver Acción**). Sin ella, los escenarios del auditado fallan con un mensaje que lo explica.
- Ningún escenario crea ni modifica datos. Todos son `@lectura`: el fixture aborta cualquier escritura.

## Escenarios

### 1. El auditado consulta el registro de avances (`@jefe-dependencia`)

Archivo: `tests/plan-mejoramiento/registro-avances-auditado.spec.ts`

1. Entrar desde el listado a una acción de la que es responsable (**Registrar Avances**, **Ver Calificación** o **Ver Acción**); abre `/registrar-avances/:id`.
2. Ve **Evidencias de avance** y **Calificación de Control Interno**. No ve el formulario de calificación ni el botón de cargue del auditor. No hay stepper.
3. El chip indica el estado del cargue. **Añadir documento** está presente y solo se habilita con **Cargue habilitado**.
4. **Ficha de la acción** abre el panel en la pestaña **Acción**. Con la flecha derecha recorre Hallazgo → Auditoría → Responsables → Acción, y con Esc se cierra.
5. **Ver hallazgo** abre el panel directamente en **Hallazgo**.
6. A 390 px de ancho no hay desborde horizontal.

### 2. El auditor revisa y valida el formulario de calificación (`@auditor`)

Archivo: `tests/plan-mejoramiento/calificacion-auditor.spec.ts`

1. Entrar desde el listado con **Calificar** o **Habilitar Cargue**; abre `/registrar-avances/:id` con la vista del auditor.
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
