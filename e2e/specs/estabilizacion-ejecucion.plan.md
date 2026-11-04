# Plan de pruebas — Estabilización de Ejecución y Planeación

Issue: udistrital/sisifo_documentacion#940 · MF: plan_anual_auditoria_mf · Etiquetas: `@ejecucion`, `@planeacion`, `@semilla`

## Contexto

- **Ejecución › Auditorías internas**: el paso 4 del informe, **Resumen de Hallazgos**, lista cada hallazgo con su número, su criterio y una columna **Descripción del Hallazgo**. Esa columna debe mostrar el texto corto del campo **Hallazgo** (`hallazgo.titulo`), no el párrafo de **Descripción** (F1).
- **Planeación › Auditorías internas**: el auditor asignado inicia la ejecución de una auditoría con el programa aprobado por el auditado. El historial debe registrar su rol (F2).

## Datos semilla

Los crea, por la API del CRUD, el escenario `tests/semillas/ejecucion-2010.spec.ts` (`@semilla @auditor-experto @escritura`). Son cuatro auditorías especiales de la vigencia `2010` (`E2E_PROG_VIGENCIA_E2E`), sin PAA, con el auditor de pruebas asignado como líder. **No se limpian**: son datos fijos de los escenarios de lectura.

| Semilla | Título | Consecutivo OCI | Estado | Contenido |
|---|---|---|---|---|
| A | `SEMILLA-E2E Resumen de hallazgos` | `SEMILLA-E2E-01` | `REVISION_PREINFORME_JEFE` | Informe con 1 tema, 1 subtema y 2 hallazgos, cada uno con título corto ≠ descripción larga |
| B | `SEMILLA-E2E Iniciar ejecución` | `SEMILLA-E2E-02` | `APROBADO_PROGRAMA_AUDITADO` | — |
| C | `SEMILLA-E2E Edición de informe` | `SEMILLA-E2E-03` | `CREANDO_PREINFORME` | Informe con 1 tema cuya descripción es `NuxeoEnlace:<uuid ficticio>`, 1 subtema y 1 hallazgo. El gestor se simula en los escenarios |
| D | `SEMILLA-E2E Seguimiento` | `SEMILLA-E2E-04` | `CREANDO_INFORME_FINAL` (seguimiento) | Informe sin temas |

- La semilla es idempotente: lo que ya existe no se vuelve a crear. Se corre solo cuando falta: `E2E_ESCRITURA=1 npx playwright test tests/semillas --grep @semilla`.
- El prefijo `SEMILLA-E2E` no lo borra la pre-limpieza de Programación (`liberarEspeciales` solo borra `E2E-…`). Al no tener PAA, tampoco choca con `liberarVigencia`.
- Si se borra a mano, la siguiente corrida de la semilla la vuelve a crear.

## Escenarios

### 1. El resumen de hallazgos muestra el hallazgo y no su descripción (`@ejecucion @auditor @lectura`)

Archivo: `tests/ejecucion/resumen-hallazgos.spec.ts`

1. En **Ejecución › Auditorías internas**, vigencia `2010`, la fila de la semilla A ofrece **Ver Preinforme**, que abre el informe en solo lectura.
2. En el paso 4, la tabla tiene las columnas **Número Hallazgo**, **Criterio** y **Descripción del Hallazgo**, con una fila por hallazgo.
3. Cada fila tiene el número `2.1.n`, el criterio y el **título corto** del hallazgo.
4. Ninguna descripción larga aparece en la tabla.
5. No hay escrituras (`escriturasBloqueadas` vacío). Se adjunta una captura del resumen.

### 2. El auditor asignado inicia la ejecución con su rol (`@planeacion @auditor @lectura`)

Archivo: `tests/planeacion/iniciar-ejecucion-auditor.spec.ts`

1. En **Planeación › Auditorías internas**, vigencia `2010`, el menú de la semilla B incluye **Iniciar Ejecución**.
2. Al elegirla, pide confirmación ("¿Está seguro(a) de iniciar la ejecución de esta auditoría?").
3. Al confirmar se intenta `POST …/auditoria-estado` con `estado_id = POR_EJECUTAR`, `fase_id = EJECUCION PRELIMINAR` y `usuario_rol = AUDITOR`. Se adjunta el cuerpo, sin el `usuario_id`.
4. Esa es la única escritura, y el fixture la bloquea: la semilla B sigue en `APROBADO_PROGRAMA_AUDITADO`.

### 3. El auditor no ve Iniciar Ejecución fuera de su estado (`@planeacion @auditor @lectura`)

Archivo: `tests/planeacion/iniciar-ejecucion-sin-permiso.spec.ts`

1. En la misma pantalla, la semilla A (preinforme en revisión) no ofrece **Iniciar Ejecución**: no tiene menú, o el menú no la incluye.

### 4. Con el gestor documental caído, el paso 3 muestra los temas y conserva la descripción (`@ejecucion @auditor @simulado @lectura`)

Archivo: `tests/ejecucion/descripcion-gestor-caido.spec.ts`. El gestor responde como WSO2 el 03/11 (404 "No matching resource", sin CORS); ver `tests/ejecucion/gestor.ts`.

1. Se abre la semilla C con **Editar Preinforme**.
2. Aparece el aviso "No se pudo cargar desde el gestor documental la descripción de 1 tema(s)", y el MF intentó una sola descarga.
3. El paso 3 muestra el tema, con su subtema y su hallazgo. En lugar del editor de la descripción hay un aviso (`role="alert"`).
4. Al **Guardar** (y confirmar), el `PUT tema/:id`, que está bloqueado, lleva el `NuxeoEnlace` original. No hay ningún intento de subir al gestor.

### 5. El editor muestra la imagen del tema y guardar sin cambios no la vuelve a subir (`@ejecucion @auditor @simulado @lectura`)

Archivo: `tests/ejecucion/descripcion-con-imagen.spec.ts`. El gestor responde un HTML con texto y un PNG embebido.

1. Se abre la semilla C. El editor del tema muestra el texto y la imagen (`img[src^="data:image/png"]`), sin aviso, y el MF hizo una sola descarga.
2. Al guardar sin cambios, el `PUT tema/:id` reutiliza el `NuxeoEnlace`, sin volver a subir el documento.

### 6. La semilla de Ejecución y Planeación (`@semilla @auditor-experto @escritura`)

Archivo: `tests/semillas/ejecucion-2010.spec.ts`

1. Crea lo que falte de las semillas A y B. Adjunta "creado en esta corrida", o "nada: la semilla ya existía".
2. La segunda corrida no crea nada.
