# Plan de pruebas — Programación (fase 1): Plan Anual de Auditoría, Asignar Auditorías y Auditorías Especiales

Issue: udistrital/sisifo_documentacion#939 (etapa 2) · MF: plan_anual_auditoria_mf · Etiqueta: `@programacion`

## Contexto

La fase 1 de SISIFO formula y aprueba el **Plan Anual de Auditoría (PAA)** de una vigencia: el auditor experto lo crea y registra sus auditorías, lo envía al **Jefe OCI**, que lo aprueba (con firma) o lo rechaza, y luego al **Secretario técnico**, que lo aprueba con el Acta del Comité (CCCI) y genera las auditorías concretas. Después se asignan auditores y se registran las auditorías especiales (sin PAA).

Estos escenarios automatizan las pruebas manuales de #800, #845, #820, #871 y #888. La matriz de cobertura completa, con lo que queda manual y por qué, está en `programacion-cobertura.md`.

## Datos semilla

| Dato | Valor por defecto | Variable | Qué tiene |
|---|---|---|---|
| PAA aprobado (lectura) | 2025 | `E2E_PROG_VIGENCIA_APROBADA` | Aprobado por el Comité, con observaciones, rechazos y ediciones extraordinarias |
| PAA con auditorías | 2026 | `E2E_PROG_VIGENCIA_AUDITORIAS` | Aprobado, con auditorías hijas asignadas y auditorías especiales |
| Vigencia de escritura | 2010 | `E2E_PROG_VIGENCIA_E2E` | Reservada para los escenarios `@escritura` |

- Los escenarios `@lectura` no escriben: el marco aborta toda escritura y el escenario lo verifica.
- Los estados que no existen en los datos (plan en Borrador, en revisión del Jefe o del Secretario) se muestran con `@simulado`: se reescribe la respuesta GET del listado y del estado actual del plan, sin tocar el backend.
- Las aserciones no dependen de totales exactos: el ambiente es compartido.
- Se entra a cada pantalla desde el listado, como un usuario. Entrar por URL directa a las pantallas internas no las monta.

## Escenarios de lectura (`@lectura`)

### 1. Listado de planes — `tabla-planes.spec.ts` (`@auditor-experto`)
1. Abrir Plan Anual de Auditoría.
2. La tabla tiene las columnas No., Creado Por, Vigencia, Fecha Creación, Estado y Acciones.
3. Las fechas están en formato dd/mm/aaaa y cada estado lleva su indicador de color.
4. Por defecto se ven 5 planes; con 10 por página se ven 10.
5. "Siguiente página" muestra otros planes.
6. El auditor experto ve el selector de vigencia y el botón "Crear PAA".

### 2. Consultar un PAA aprobado — `ver-plan-aprobado.spec.ts` (`@auditor-experto`)
1. En el PAA aprobado, el menú ofrece Ver Marco General, Ver Auditorias, Ver Documentos e Historial de Observaciones.
2. Ver Marco General: Objetivo, Alcance, Criterios y Recursos con texto, y ningún campo editable.
3. Regresar vuelve al listado.
4. Ver Auditorias: las 9 columnas, al menos una auditoría y ningún botón de edición ("Añadir Auditoría").
5. "Exportar tabla" descarga un `.xlsx`.

### 3. Documentos del PAA — `ver-documentos.spec.ts` (`@auditor-experto`)
1. Ver Documentos del PAA aprobado abre el diálogo de la vigencia.
2. Hay pestañas "Formato PAA Original" y "Formato PAA Actualizado".
3. Cada pestaña muestra su documento.
4. No se pulsa "Actualizar Documento", porque reemplaza el documento.

### 4. Historial de observaciones — `historial-observaciones.spec.ts` (`@auditor-experto`)
1. Historial de Observaciones del PAA aprobado muestra al menos una observación.
2. Cada observación tiene quién la hizo, su rol y su fecha.
3. El orden es cronológico, de la más reciente a la más antigua (hallazgo de #800, corregido en el PR #429).
4. Los rechazos se distinguen de las revisiones.

### 5. Formulario de auditoría — `formulario-auditoria.spec.ts` (`@auditor-experto`, `@simulado`)
1. Con el PAA mostrado en Borrador, el menú ofrece Editar Marco General, Registrar Auditorías y Enviar Aprobación.
2. Registrar Auditorías → "Añadir Auditoría" abre el modal.
3. Guardar vacío marca los campos obligatorios y el modal no se cierra.
4. Sin macroprocesos, Procesos no ofrece opciones; al elegir un macroproceso, sí.
5. El cronograma admite varios meses, o "Todos", que es excluyente: reemplaza a los meses elegidos (`asignarTodos`).
6. "No, cerrar" no crea nada, y al volver a abrir el formulario está vacío.
7. 0 escrituras.

### 6. Revisión del Jefe OCI — `revision-jefe.spec.ts` (`@jefe-oci`, `@simulado`)
1. El Jefe no ve "Crear PAA".
2. Con el PAA mostrado "En revisión por Jefe", el menú ofrece Ver Plan.
3. Ver Plan muestra el Formato PAA Original y los botones "Rechazar plan" y "Aprobar y enviar a Secretario".
4. Rechazar pide los motivos; "No, regresar" cierra sin rechazar.
5. 0 escrituras.

### 7. Revisión del Secretario — `revision-secretario.spec.ts` (`@secretario`, `@simulado`)
1. Con el PAA mostrado "En revisión por el Comité", Ver Plan muestra el Formato PAA Original y los botones "Rechazar Plan" y "Aprobar".
2. Aprobar pide el Acta de CCCI; "No, cerrar" cierra sin aprobar.
3. 0 escrituras.

### 8. Asignar auditorías: listado — `asignar-tabla.spec.ts` (`@auditor-experto`)
1. Vigencia con PAA aprobado: el listado tiene sus columnas y auditorías con título, tipo, auditores y estado. Las que tienen subtítulo lo muestran después de un guion.
2. Vigencia sin PAA aprobado (la de E2E): aviso "Sin plan de auditorías aprobado".

### 9. Asignar auditorías: modal — `asignar-modal.spec.ts` (`@auditor-experto`)
1. "Asignar Auditor(es)" de una auditoría con auditores abre el modal con sus datos.
2. El tipo de evaluación no se puede editar.
3. A lo sumo un auditor es líder.
4. Un auditor ya elegido no aparece en el selector de la fila nueva.
5. "No, cerrar" no guarda (0 escrituras).

### 10. Auditorías especiales — `especiales-tabla.spec.ts` (`@auditor-experto`)
1. Vigencia con especiales: el listado muestra las auditorías padre con cronograma y estado.
2. Expandir una padre muestra sus auditorías concretas.
3. Las concretas no muestran cronograma (hallazgo de #800, corregido en el PR #429).

## Escenarios de escritura (`@escritura`)

Ver `programacion-cobertura.md` y el plan de tareas T23 de la especificación. Corren sobre la vigencia de E2E, con limpieza al final, y los correos se interceptan.
