# Plan de pruebas — Auditorías externas

Issue: udistrital/sisifo_documentacion#953 · MF: plan_anual_auditoria_mf · Etiquetas: `@auditorias-externas`

## Contexto

Submódulo de Gestión Auditoría donde el auditor registra una auditoría de un ente de control ya terminada: datos generales, informe final en PDF y hallazgos (uno a uno o por cargue masivo). **Nada se guarda hasta pulsar Continuar**; entonces el MID guarda todo y crea el esqueleto del plan de mejoramiento. El registro es **una sola pantalla** con tres secciones (sin stepper).

Rutas: listado `/gestion-auditoria/auditorias-externas`, registro `/gestion-auditoria/auditorias-externas/registrar-auditoria`, detalle `/gestion-auditoria/auditorias-externas/ver-auditoria/:id`.

## Datos semilla

Ninguno. Los escenarios de lectura no necesitan auditorías registradas: validan la pantalla y las validaciones del cliente. Usan `fixtures/acta-e2e.pdf` como PDF de ejemplo y la vigencia de E2E de Programación (`VIGENCIA_E2E`).

## Escenarios

### 1. El registro es una sola pantalla con tres secciones (`@auditorias-externas @auditor-experto @lectura`)

Archivo: `tests/auditorias-externas/registro-pantalla-unica.spec.ts`

1. Abrir el registro.
2. Las secciones son **Información general**, **Informe final** y **Hallazgos**, en ese orden; no hay `mat-stepper`.
3. Están **Cancelar** y **Continuar**; no hay "Guardar y Continuar" ni "Volver".

### 2. Continuar sin datos lista lo que falta y no escribe (`@auditorias-externas @auditor-experto @lectura`)

Archivo: `tests/auditorias-externas/continuar-bloqueado.spec.ts`

1. Pulsar **Continuar** con el registro vacío: la alerta "No es posible continuar" pide la información general, el PDF y al menos un hallazgo.
2. Adjuntar el PDF y volver a pulsar: ya no pide el PDF, sigue pidiendo la información general y los hallazgos.
3. Ninguna escritura sale hacia el servidor (`escriturasBloqueadas` vacío).

### 3. El listado pide al MID las auditorías de la vigencia y Crear abre el registro con la vigencia (`@auditorias-externas @auditor-experto @lectura`)

Archivo: `tests/auditorias-externas/listado.spec.ts`

1. Abrir el listado: responde `200` y muestra las filas que trae o el aviso "No hay auditorías externas registradas.".
2. Elegir la vigencia de E2E: la tabla se vuelve a pedir con `vigencia_id`.
3. **Crear** abre el registro con la vigencia en la URL (`?vigencia=`).

## Fuera de la automatización (y por qué)

| Criterio | Motivo | Cómo se verifica |
|---|---|---|
| Registrar de punta a punta (`@escritura`) | Crea una auditoría, hallazgos, un documento en Nuxeo y un plan que no se pueden borrar desde la interfaz | Prueba manual con el CRUD y el MID locales; el MID tiene pruebas unitarias del flujo y de la compensación |
| Cargue masivo con errores por fila | `POST /cargue-masivo/auditoria-externa/validacion` no escribe, pero el seguro de `@lectura` bloquea todo `POST` | Pruebas unitarias del MID (`cargue-masivo-externa.validacion.spec.ts`) y prueba manual con los archivos de `~/docs-issues/archivos-prueba-953/` |
| Detalle de una auditoría registrada | Requiere una auditoría existente (no hay semilla: crearla es una escritura sin limpieza) | Prueba manual después del registro |
| Aprobar o editar tras Continuar | Fuera de alcance: lo registrado queda como histórico | — |
