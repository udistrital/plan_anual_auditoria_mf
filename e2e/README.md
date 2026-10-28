# Pruebas funcionales E2E — plan_anual_auditoria_mf

Pruebas automatizadas que recorren el sistema en el navegador como lo haría una persona: inician sesión con usuarios de prueba por rol, navegan por el menú y verifican lo que muestra cada pantalla. Usan [Playwright](https://playwright.dev) con TypeScript y el patrón Page Object Model.

Esta carpeta es **autocontenida**: tiene su propio `package.json` y no depende de las dependencias de Angular del MF.

## Requisitos

- Node.js 20.12 o superior.
- El sistema arriba: en local, el root en `http://localhost:4200` cargando este MF en `4203` (`pnpm start` en cada repo).
- Usuarios de prueba **dedicados** del ambiente de pruebas, uno por rol. Nunca cuentas personales ni de producción.

## Instalación (una vez)

```bash
cd e2e
npm ci
npx playwright install chromium
cp .env.e2e.example .env.e2e     # y llenar los usuarios de prueba
```

`e2e/.env.e2e` **nunca se versiona** (está en `.gitignore`). Las credenciales las entrega quien administra las cuentas de prueba; no se envían por el repositorio ni por chat.

| Variable | Para qué |
|---|---|
| `E2E_BASE_URL` | URL del root (por defecto `http://localhost:4200`) |
| `E2E_<ROL>_USER` / `E2E_<ROL>_PASS` | Usuario de prueba de cada rol: `E2E_AUDITOR_*`, `E2E_JEFE_DEPENDENCIA_*` |
| `E2E_VIGENCIA` | Vigencia con datos para los escenarios (por defecto `2026`) |
| `E2E_ACCION_ID` | Opcional: acción fija para registro de avances (si no, la primera del listado) |

Un rol sin usuario se omite con un aviso: sus escenarios no se ejecutan.

## Ejecutar

```bash
npm test                                   # todo
npm run test:lectura                       # solo escenarios que no modifican datos
npx playwright test --grep @navegacion     # un grupo (por etiqueta)
npx playwright test --project=auditor      # un rol
npm run report                             # abre el reporte con capturas
```

### Sesión de los usuarios de prueba (automático)

El login se hace por rol al inicio y la sesión se guarda en `e2e/.auth/` (no versionado). El marco la cuida solo:

- **Al empezar**, reutiliza la sesión guardada solo si el sistema la aceptaría: el token no ha vencido y no han pasado 15 minutos sin actividad (el sistema cierra la sesión por inactividad). Si no, hace un login nuevo.
- **Durante la corrida**, cada escenario que pasa guarda la sesión, que así sigue activa para el siguiente.
- **Si la sesión se cierra a mitad de corrida** (por ejemplo, alguien inició sesión con la misma cuenta en otro lado), el escenario se detiene de inmediato, se hace un login nuevo y el escenario se repite **una vez**. En el reporte aparece como *flaky*, con el mensaje "el root cerró la sesión del rol …". Un escenario que falla por otra causa **no** se repite.
- **Si el usuario o la contraseña son incorrectos**, no se reintenta (WSO2 bloquea la cuenta tras varios intentos): la corrida se detiene con "login del rol … rechazado". Revisa `e2e/.env.e2e` o el estado de la cuenta antes de volver a correr.

El login corre en un proceso aparte, sin trazas: la contraseña nunca queda en el reporte.

### Si algo falla

El reporte (`npm run report`) muestra el paso que falló, la captura y la traza. La traza se abre con `npx playwright show-trace test-results/<carpeta>/trace.zip`.

- *"No se pudo cargar la información…"* en la captura: falló una consulta a las APIs de pruebas (VPN o servicio lento). Vuelve a correr.
- Mientras corren las pruebas, no inicies sesión con las cuentas de prueba en tu navegador.

> **Cuidado al compartir resultados.** Las trazas (`trace.zip`), el reporte (`playwright-report/`) y las capturas contienen la sesión de la cuenta de prueba (token en las cabeceras y en el `localStorage`) y datos reales del ambiente de pruebas (nombres de funcionarios, dependencias). Compártelos solo dentro del equipo y nunca los publiques en sitios abiertos. El token vence solo, pero mientras está vigente da acceso con ese rol.

## Estructura

```
e2e/
  core/                     ← genérico: igual en todos los proyectos
    config.ts               variables, roles con usuario, un proyecto de Playwright por rol
    global-setup.ts         sesión por rol al inicio: reutiliza si sigue válida, si no login nuevo
    sesion.ts               reglas de la sesión (vencimiento e inactividad) y renovación
    login.mjs               login institucional (WSO2) en un proceso aparte, sin trazas
    navegador.ts            ajustes del navegador para el root/core-mf (CORS, overlay)
    fixtures.ts             test extendido: vigilancia de la sesión, bloqueo de escrituras en @lectura, errores, simularGet
    base.page.ts            clase base de los page objects
  pages/                    ← propio del proyecto: un page object por pantalla
  specs/<funcionalidad>.plan.md   plan de pruebas (qué se prueba y con qué datos)
  tests/<modulo>/<escenario>.spec.ts   un escenario por archivo
  playwright.config.ts      roles del proyecto y opciones de ejecución
```

- Los escenarios no usan selectores: piden a los page objects acciones con nombres del negocio (`registro.abrirFicha()`). Si cambia una pantalla, se ajusta su page object.
- `core/` no sabe nada de SISIFO: es la parte que otro proyecto copia tal cual.

## Etiquetas

Cada escenario lleva:

| Etiqueta | Significado |
|---|---|
| `@<modulo>` | Módulo del MF (`@plan-mejoramiento`) o grupo (`@navegacion`) |
| `@<rol>` | Rol con el que corre (`@auditor`, `@jefe-dependencia`): cada proyecto corre solo los suyos |
| `@lectura` / `@escritura` | Si consulta o modifica datos |
| `@simulado` | Prepara un estado reescribiendo una respuesta GET; no prueba el backend |

**Garantía de lectura:** en los escenarios `@lectura`, el marco aborta cualquier `POST/PUT/PATCH/DELETE` a las APIs y lo deja en el reporte. Por eso se pueden correr contra el ambiente de pruebas compartido sin modificar datos (`tests/plan-mejoramiento/bloqueo-escrituras.spec.ts` lo demuestra).

## Agregar un escenario (equipo)

1. Plan propio en `specs/<funcionalidad>.plan.md` (no se edita el plan de otra funcionalidad).
2. Page object en `pages/` para cada pantalla nueva, extendiendo `BasePage`.
3. Escenario en `tests/<modulo>/<escenario>.spec.ts` con la cabecera `// spec: e2e/specs/<funcionalidad>.plan.md` y sus etiquetas.
4. Esperar por lo que se ve (`expect(...).toBeVisible()`), nunca por tiempo (`waitForTimeout`).
5. Antes del PR, correr **todos** los escenarios del módulo: `npx playwright test --grep @<modulo>`.

Quien cambia una pantalla actualiza en el mismo PR los escenarios que la usan. Quien cambia `core/` corre la suite completa.

## Pipeline (propuesta, pendiente de autorización)

El MF se despliega a pruebas en las ramas `release/*` (`publish_s3_release`). La propuesta es un paso posterior que corre los escenarios de lectura contra el ambiente desplegado y detiene el pipeline si fallan:

```yaml
- name: e2e_pruebas
  image: mcr.microsoft.com/playwright:v1.64.1-noble
  environment:
    E2E_BASE_URL: <url del root en pruebas>
    E2E_AUDITOR_USER:
      from_secret: e2e_auditor_user
    E2E_AUDITOR_PASS:
      from_secret: e2e_auditor_pass
    E2E_JEFE_DEPENDENCIA_USER:
      from_secret: e2e_jefe_dependencia_user
    E2E_JEFE_DEPENDENCIA_PASS:
      from_secret: e2e_jefe_dependencia_pass
  commands:
    - cd e2e && npm ci && npm run test:lectura
  depends_on: [publish_s3_release]
  when:
    branch: [release/*]
    event: [push]
```

Pendiente antes de activarlo: validar el login y el CORS contra la URL de pruebas desplegada, registrar los secrets con Infraestructura, definir quién rota las contraseñas de las cuentas de prueba e informar a Seguridad. Si se publica el reporte HTML, va a un almacenamiento de acceso restringido, nunca a un bucket público, porque contiene la sesión de las cuentas de prueba (ver "Cuidado al compartir resultados").
