# Plan de pruebas — Foro de la acción de mejora

Issue: udistrital/sisifo_documentacion#948 · MF: plan_anual_auditoria_mf · Etiqueta: `@plan-mejoramiento`

## Contexto

En **Registro de avances** (Gestión de acciones), el botón **Foro** abre un panel lateral con la conversación de la acción. Los mensajes los guarda y los lee el MID (`GET`/`POST /accion-mejora/:accionId/comentario`) en la colección `comentario_accion` del CRUD:

- Lista plana, más recientes al final, de 20 en 20 con «Ver anteriores». Se lee al abrir el panel, con **Actualizar** y tras enviar (no hay tiempo real).
- Cada mensaje muestra autor, rol, dependencia (si es de una dependencia) y fecha.
- Puede comentar el personal de Control Interno (esté o no asignado al plan) y las dependencias responsables de la acción (líder o apoyo). El MID lo informa con `MetaData.puede_comentar`; el resto solo lee. No depende del estado de la acción.
- Los mensajes no se editan ni se borran desde la interfaz.

## Datos semilla

- La acción se elige igual que en `registro-avances.plan.md` (vigencia `E2E_VIGENCIA`, o la de `E2E_ACCION_ID`).
- Roles: `jefe-dependencia` (responsable de la acción), `auditor` (asignado al plan), `jefe-oci` (no asignado). Las cuentas están en `e2e/.env.e2e`.
- `@escritura` solo contra el **CRUD y el MID locales** (o en pruebas con aprobación del equipo). Los comentarios que crea llevan el marcador `E2E-AAAAMMDD-HHmm` y se borran de forma lógica al final por el CRUD indicado en `E2E_CRUD_URL` (por defecto `http://localhost:8080`).
- `E2E_ACCION_ID`: obligatorio para el escenario 3 (el listado de Control Interno no ofrece la opción de revisión) y recomendable para el 4. Sin él, los escenarios 1 y 2 usan la acción del jefe de dependencia.
- Para correrlos con poca memoria: root y MF compilados (`ng build --configuration=local`) y servidos como archivos estáticos en 4200 y 4203, y CRUD y MID locales en 8080 y 8081.

## Escenarios

### 1. El auditado abre el foro y puede redactar (`@jefe-dependencia`, `@lectura`)

Archivo: `tests/plan-mejoramiento/foro-lectura-auditado.spec.ts`

1. Abre la acción y pulsa **Foro**: el panel carga los mensajes y ya no muestra «Foro en construcción».
2. Si hay mensajes, el primero muestra «Nombre · Rol [· Dependencia]» y la fecha; si no, «Aún no hay mensajes en el foro de esta acción.».
3. La dependencia responsable ve el campo «Nuevo mensaje». **Enviar** está deshabilitado sin texto, se habilita al escribir y el contador cuenta los caracteres (`28/1000`). No se envía nada.

### 2. Quien no puede comentar ve solo lectura (`@jefe-dependencia`, `@lectura`, `@simulado`)

Archivo: `tests/plan-mejoramiento/foro-solo-lectura.spec.ts`

1. Se reescribe `MetaData.puede_comentar` de la lectura a `false` (los datos no tienen una dependencia que llegue a la pantalla sin ser responsable). No prueba el backend: el 403 real lo cubren los specs del MID.
2. El panel muestra «Solo lectura: pueden comentar las dependencias responsables de la acción y el personal de Control Interno.».
3. No aparecen el campo ni el botón **Enviar**.

### 3. Control Interno puede redactar sin estar asignado (`@jefe-oci`, `@lectura`)

Archivo: `tests/plan-mejoramiento/foro-redaccion-oci.spec.ts`

1. El Jefe de Control Interno abre una acción (con `E2E_ACCION_ID` si su listado no la ofrece) y pulsa **Foro**.
2. Ve el campo «Nuevo mensaje» y **Enviar** se habilita al escribir. No se envía nada.

### 4. El auditor publica y el mensaje persiste (`@auditor`, `@escritura`)

Archivo: `tests/plan-mejoramiento/foro-publicar-auditor.spec.ts`

1. Pre-limpieza: se borran los comentarios con marcador `E2E-` de corridas interrumpidas en esa acción. Lo ajeno no se toca.
2. El auditor publica «E2E-… mensaje de prueba del foro»: el MID responde 201 y el campo queda vacío.
3. El mensaje aparece una sola vez, con su autor, el rol de Auditor y la fecha.
4. Cierra el panel, lo abre otra vez y pulsa **Actualizar**: el mensaje sigue ahí (viene de la base).
5. El CRUD lo tiene activo y asociado a la acción.
6. Limpieza registrada apenas se crea: `DELETE /comentario-accion/:id` (borrado lógico), aunque el escenario falle. Después de cada corrida se verifica por API que no quedó ninguno activo.

### 5. «Ver anteriores» pagina de 20 en 20 (`@jefe-dependencia`, `@lectura`, `@simulado`)

Archivo: `tests/plan-mejoramiento/foro-ver-anteriores.spec.ts`

1. La lectura se responde con 25 mensajes inventados, paginados como el MID (más recientes primero). No toca el backend.
2. Al abrir se ven 20 mensajes (del 06 al 25) y el botón dice «Ver anteriores (5)».
3. Al pulsarlo se ven 25 en orden cronológico (del 01 al 25) y el botón desaparece.

### 6. Un envío fallido avisa sin exponer detalles y conserva el texto (`@jefe-dependencia`, `@lectura`, `@simulado`)

Archivo: `tests/plan-mejoramiento/foro-error-envio.spec.ts`

1. El `POST` responde con errores inventados (no llega al backend ni al bloqueo de escrituras).
2. Con un 400 del MID se muestra su mensaje («El mensaje no puede superar 1000 caracteres»), el texto sigue en el campo y **Enviar** queda habilitado.
3. Con un 500 se muestra el texto fijo «No se pudo enviar el comentario. Intente de nuevo.», sin el detalle técnico, y el texto sigue ahí.
4. No se creó ningún mensaje.

## Fuera de este plan

- Los 403 del MID (dependencia ajena, administrador), los 400 y la paginación del API: los cubren los specs del MID y la prueba manual de la Fase 1.
- Sin cobertura E2E todavía (sugeridas por el análisis de impacto): error de lectura con **Reintentar**, estado vacío con datos simulados, contador en el límite de 1000 caracteres y el foro con un rol sin permiso (secretario, administrador).
- Nota interna, eventos automáticos y «Seguir» con correo (existían en Sísifo v1): fuera de la issue #948.
