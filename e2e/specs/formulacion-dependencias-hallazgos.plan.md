# Plan de pruebas — Formulación: causa, dependencias y hallazgos

Issue: udistrital/sisifo_documentacion#947 · MF: plan_anual_auditoria_mf · Etiqueta: `@plan-mejoramiento`

## Contexto

En **Planes de Mejoramiento › Formulación de planes › Registrar Plan**, el auditado (jefe o asistente de la dependencia) formula las acciones de cada hallazgo con el modal **Añadir/Editar acción del hallazgo**. Lo que cambia #947:

- **Fase 1, causa**: la causa del hallazgo es un **texto abierto** que escribe la dependencia en cada acción (`accion_mejora.causa`). Es obligatorio, tiene máximo 1000 caracteres y un contador. Ya no sale del criterio de fase 3 (`hallazgo.criterio`). La tabla, el Excel, el dictamen del auditor, la ficha de Registrar avances y el PDF la leen desde la acción.
- **Fase 2, líder y apoyo**: la sección 4 lista las dependencias de la auditoría, cada una con su interruptor «Líder» (una o más, al menos una). El apoyo es opcional: «¿Vincular dependencias corresponsables / de apoyo? No/Sí».
- **Fase 4, remisión**: pendiente de aprobación en la daily.

## Datos semilla

- Auditoría `E2E_AUDITORIA_FORMULACION`. Por defecto es la del plan 2026 del jefe de dependencia en pruebas, con 8 hallazgos y acciones.
- En pruebas (06/11/2026) la cuenta del jefe de dependencia **no tiene planes en Creando con hallazgos**. Por eso el escenario simula con `simularGet` que el plan está en Creando (`E2E_ESTADO_CREANDO`, 7082 en pruebas) y la tabla queda en modo edición. Es `@simulado`: no prueba el estado real del plan.
- Todo es `@lectura`. El modal se abre y se descarta, y el fixture aborta cualquier escritura. Guardar una acción con causa (`@escritura`) requiere el CRUD local con el campo `causa`; en pruebas, hasta que se despliegue, se verifica a mano.

## Escenarios

### 1. La causa de la acción es un texto abierto (`@jefe-dependencia @lectura @simulado`)

Archivo: `tests/plan-mejoramiento/formular-accion-causa.spec.ts`

1. Abrir Registrar plan de la auditoría semilla, con el plan simulado en Creando. Se ve «Editar Plan de Mejoramiento».
2. Menú del primer hallazgo → **Agregar Acción**: la sección 1 tiene el campo **Causa del hallazgo** editable, vacío y con el contador `0 / 1000`.
3. Al escribir 36 caracteres el contador muestra `36 / 1000`. El campo tiene `maxlength=1000`.
4. Al vaciarlo y salir del campo se muestra «Campo requerido». **Descartar** cierra el modal sin guardar.
5. En un hallazgo con acciones, la columna **Causa del Hallazgo** de cada acción muestra la causa de la acción o «Sin causa registrada», nunca el criterio del hallazgo.
6. **Editar Acción** precarga en el campo la misma causa de la acción (vacío en las acciones anteriores a #947).
7. Ninguna escritura.

### 2. Dependencias líderes y apoyo opcional (`@jefe-dependencia @lectura @simulado`)

Archivo: `tests/plan-mejoramiento/formular-accion-dependencias.spec.ts`

1. Con el plan simulado en Creando, **Agregar Acción**: las dependencias de la auditoría aparecen marcadas como líderes. Si es una sola, su interruptor está deshabilitado.
2. El apoyo inicia en **No**, sin selector ni «Vincular dependencia». Con **Sí** aparecen («Vincular» deshabilitado sin selección) y con **No** se ocultan. Sin apoyo, al llenar causa, tipo y acción planteada el pie dice «Campos obligatorios completos».
3. Con la auditoría simulada con **dos** dependencias (la real y otra responsable del plan, vía `page.route` sobre `GET MID auditoria/:id`): las dos aparecen como líderes y habilitadas. Se puede dejar solo una. Sin ninguna aparece «Seleccione al menos una dependencia líder.» y el pie dice «Faltan campos obligatorios». Con las dos vuelve a estar completo.
4. **Editar Acción**: los interruptores marcados y los chips de apoyo coinciden con `responsable-accion` de esa acción, y «Sí/No» refleja si tiene apoyo. Una acción antigua sin líder guardado muestra el aviso de líder obligatorio. **No** quita los chips de apoyo y oculta el selector; **Sí** lo vuelve a mostrar vacío.
5. Ninguna escritura.

Guardar los responsables (`POST`/`PUT`/`DELETE responsable-accion`) es `@escritura`: requiere el CRUD local con datos dedicados y no se automatizó en esta fase. Se verifica a mano.

### 3. La causa en la ficha de Registrar avances (`@jefe-dependencia @lectura`)

Archivo: `tests/plan-mejoramiento/registro-avances-auditado.spec.ts` (paso agregado al escenario de #939)

1. En la ficha de la acción, pestaña **Hallazgo**: el dato **Causa** es la causa de la acción (`accion_mejora.causa`) o «—» si no tiene. No es el criterio del hallazgo.

## Cómo correr

```bash
cd e2e
npx playwright test --grep @plan-mejoramiento            # todos los del módulo (sin @escritura)
npx playwright test tests/plan-mejoramiento/formular-accion-causa.spec.ts --project=jefe-dependencia
```
