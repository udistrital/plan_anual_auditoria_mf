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

Escriben en el ambiente de pruebas compartido, solo sobre la vigencia de E2E (2010), y solo se corren con autorización (`npm run test:escritura`).

- **Antes:** si la vigencia tiene un PAA activo de E2E (marcador `E2E-AAAAMMDD-HHmm` en el objetivo), se borra. Si es de otra persona, el escenario falla sin tocarlo.
- **Después, aunque el escenario falle:** borrado lógico por API de todo lo que creó (plan, auditorías padre e hijas, asignaciones, especiales). Lo limpiado queda en el adjunto "limpieza" del reporte. No se borran los archivos de Nuxeo (Formato PAA firmado, actas).
- **Firma y gestor documental reales.** Los correos se interceptan: se responden como enviados y su contenido queda en el reporte.
- El listado de planes también trae los planes borrados lógicamente. En estos escenarios se ocultan solo en el navegador de la prueba (hallazgo reportado en la issue).
- Los pasos comunes (crear, enviar, aprobar con firma, aprobar con acta, rechazar) están en `tests/programacion/ciclo.ts`.

### 11. Ciclo de aprobación — `ciclo-paa-aprobacion.spec.ts` (auditor experto → jefe OCI → secretario)
1. No se puede crear un PAA en una vigencia que ya tiene uno (la aprobada).
2. El auditor experto crea el PAA de la vigencia de E2E: queda en Borrador.
3. El marco general de un PAA nuevo trae los textos por defecto.
4. Con un campo del marco vacío, Guardar no envía nada: "Objetivo es requerido" e "Información no guardada".
5. Llena y guarda el marco general.
6. Registra una auditoría con todos los campos: Informe de Ley, Marzo y Junio, cantidad 2.
7. Al editarla, quitar un macroproceso quita sus procesos, y cerrar sin guardar no la cambia.
8. Cargue masivo con `fixtures/cargue-masivo-e2e.xlsx`: dos auditorías más.
9. Ordena por "Nombre de auditoría A-Z", previsualiza el Formato PAA y guarda. Al volver, el orden se mantiene.
10. Envía el PAA al jefe: estado "En Revisión por Jefe" (sin aviso de éxito por las notificaciones deshabilitadas, #888 H-07).
11. El jefe usa "Editar Auditorías": cambia el cronograma de una auditoría y guarda el PAA.
12. El jefe descarga todos los documentos (`documentosPAA-<vigencia>.zip`) y aprueba con su firma: pasa al Comité.
13. El secretario adjunta `fixtures/acta-e2e.pdf` y aprueba: "Aprobado por Comité Coordinador".
14. Se generan 5 auditorías (2 + 1 + 2), y las dos del Informe de Ley llevan su mes como subtítulo (MARZO, JUNIO).
15. Ver Documentos incluye el Acta de Comité.
16. En Asignar, la auditoría generada aparece como "título – subtítulo"; se asigna un auditor líder y pasa a "Auditor asignado".
17. Edición extraordinaria: solo edita (no añade), pide confirmar con el estado de la auditoría y no deja salir sin el acta de modificación. Con el acta, Guardar genera el Formato PAA Actualizado.
18. El PAA muestra el Formato PAA Actualizado y el historial de ediciones extraordinarias.
19. Cada estado del PAA tiene `usuario_id`. Tienen `usuario_rol` los que la aplicación lo envía: creación, envío y aprobación del secretario. La aprobación del jefe no lo envía (hallazgo); los estados quedan adjuntos al reporte.

No automatizado: "Eliminar Auditoría". En pruebas el CRUD no recibe el cuerpo del DELETE y responde 400 (hallazgo en la issue).

### 12. Ciclo con rechazos — `ciclo-paa-rechazos.spec.ts` (auditor experto → jefe OCI → secretario)
1. El auditor experto crea el PAA, llena el marco, registra una auditoría, guarda y envía.
2. El jefe lo rechaza con su observación: pasa a Rechazado.
3. El auditor experto ve el rechazo del jefe en el historial de observaciones (el más reciente, en rojo, con quién lo hizo).
4. El PAA rechazado vuelve a tener Editar Marco General, Registrar Auditorías y Enviar Aprobación, y se reenvía.
5. El jefe aprueba con su firma y el secretario lo rechaza con su observación.
6. El historial muestra los dos rechazos, el más reciente primero.
7. Los rechazos quedan registrados con usuario, rol y observación.

### 13. Asignar auditores — `asignar-completo.spec.ts` (auditor experto)
1. Prepara un PAA aprobado con una auditoría usando la aplicación (escenario 11 abreviado: también firma y acta).
2. Asigna dos auditores, uno líder: la auditoría pasa a "Auditor asignado".
3. Al volver a abrir, el modal muestra a los dos asignados y al líder.
4. Desasignar uno lo pasa a "Auditores Desasignados" y deja de ofrecerse en los selectores.
5. No deja desasignar al único auditor asignado.
6. "Reasignar" lo devuelve a los asignados.
7. La tabla de Asignar muestra a los dos auditores.

### 14. Auditorías especiales — `especiales-ciclo.spec.ts` (auditor experto)
1. Antes: borra las especiales de E2E de la vigencia (las de otras personas no se tocan).
2. Crea una auditoría especial (queda "Sin Titulo").
3. Al editarla con cantidad 1 se genera su auditoría concreta y se abre la asignación de auditores.
4. Expandir la padre muestra su concreta.
5. La concreta se elimina.
6. "Generar una Auditoría" la crea de nuevo; al llegar a la cantidad registrada, avisa "Ya tiene el número máximo de auditorías".
