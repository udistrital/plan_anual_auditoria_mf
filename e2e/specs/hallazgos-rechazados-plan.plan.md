# Plan de pruebas — Hallazgos rechazados en Registrar plan

Sin issue (fix sobre la rama del foro #948) · MF: plan_anual_auditoria_mf · Etiqueta: `@plan-mejoramiento`

## Contexto

En el preinforme, el auditor puede rechazar un hallazgo (`PUT hallazgo/:id { rechazado: true, … }`); no se pone `activo: false`. El informe final, el PDF del plan y la formulación (MID) ya los excluyen. La tabla de hallazgos y el resumen de cumplimiento de **Registrar plan** (MF) no lo hacían: mostraban y contaban los rechazados. Ahora piden `hallazgo?query=informe_id:…,activo:true,rechazado__not:true`.

## Datos semilla

- Vigencia **2026** de la base de pruebas (id de Parámetros `7087`): 5 planes de mejoramiento, y solo uno tiene un hallazgo descartado:
  - `6ae335fbb80ffc751c08bb72` (plan en estado 7084): informe con 3 hallazgos activos y 1 rechazado por el auditor experto. Es la semilla por defecto; se cambia con `E2E_AUDITORIAS_CON_RECHAZADOS` (ids separados por coma).
  - Los otros 4 planes de 2026 no tienen rechazados (uno con 8 hallazgos activos y tres sin informe).
- Solo lectura: el escenario es `@lectura` y el marco aborta cualquier escritura.
- El escenario calcula lo esperado consultando el mismo CRUD que usa la pantalla; no depende de números fijos.

## Escenarios

### 1. Registrar plan no muestra ni cuenta los rechazados (`@jefe-dependencia`, `@lectura`)

Archivo: `tests/plan-mejoramiento/hallazgos-rechazados-plan.spec.ts` (un caso por auditoría semilla)

1. Se abre `registrar-plan/:auditoriaId`.
2. Las consultas de hallazgos de la tabla y del resumen llevan `rechazado__not:true`.
3. La tabla muestra tantas filas de hallazgo como hallazgos activos no rechazados.
4. El resumen «(X de N hallazgos con acciones)» tiene N igual a los no rechazados.
5. No se escribe nada (`@lectura`).

## Fuera de este plan

- El comportamiento de los hallazgos rechazados en el preinforme (otro módulo, Ejecución).
- La numeración fallback de hallazgos sin `no_hallazgo`: sigue siendo la posición en la lista, ahora ya filtrada, igual en la tabla y en el resumen.
