# Guía de implementación de tours guiados con driver.js

> **Documento de referencia técnica** — `plan_anual_auditoria_mf`
> Última actualización: 26 de septiembre de 2026

---

## Tabla de contenido

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Arquitectura de la solución](#2-arquitectura-de-la-solución)
3. [Instalación y configuración base](#3-instalación-y-configuración-base)
4. [El problema de las capas: CDK 21 y el *top layer*](#4-el-problema-de-las-capas-cdk-21-y-el-top-layer)
5. [`TourService`: el servicio compartido](#5-tourservice-el-servicio-compartido)
6. [Anclajes `data-tour`: el contrato con el HTML](#6-anclajes-data-tour-el-contrato-con-el-html)
7. [Definición de pasos: el archivo `*.tour.ts`](#7-definición-de-pasos-el-archivo-tourts)
8. [Coordinación de navegación entre rutas](#8-coordinación-de-navegación-entre-rutas)
9. [El componente coordinador](#9-el-componente-coordinador)
10. [Datos de demostración y protecciones](#10-datos-de-demostración-y-protecciones)
11. [Ciclo de vida, cierre y limpieza](#11-ciclo-de-vida-cierre-y-limpieza)
12. [Implementar un tour en otro sistema](#12-implementar-un-tour-en-otro-sistema)

---

## 1. Propósito y alcance

Este documento explica, en detalle, cómo se implementó el **tour guiado** del
módulo de *Plan Anual de Auditoría* (PAA) sobre [driver.js](https://driverjs.com/),
y cómo reproducir una implementación equivalente en otros sistemas o módulos.

No es solo una guía de "cómo pegar un tour encima de una pantalla". La
implementación real resolvió cuatro problemas que aparecen siempre que un tour
guiado debe hacer algo más que *resaltar un botón*:

| Problema | Solución adoptada |
| --- | --- |
| El tour debe **navegar** entre rutas y continuar desde el mismo paso | Continuación persistida + espera activa del DOM |
| El tour debe **abrir y cerrar** menús, modales y formularios | Callbacks `onNextClick` / `onPrevClick` que reutilizan los métodos reales del componente |
| El usuario debe poder **cancelar** el tour en cualquier momento, sin dejar la pantalla rota | Cierre explícito de los overlays abiertos y limpieza total del estado |
| Los overlays de Angular Material se pintan **encima** del tour | Neutralización del *top layer* del navegador + reglas de `pointer-events` |

### Qué hace el tour del PAA

Un recorrido de **32 pasos** que cubre el ciclo de vida completo de un plan
anual de auditoría:

1. Crear un PAA y ver la fila recién generada.
2. Abrir el menú de acciones de un plan en estado *Borrador*.
3. Entrar al **marco general**, revisar sus cuatro campos y guardarlo.
4. Regresar a la lista y entrar a **registrar auditorías**.
5. Agregar una auditoría, recorrer su formulario y cancelarla.
6. Descargar la plantilla, abrir el cargue masivo y cancelarlo.
7. Visualizar, guardar, exportar y eliminar auditorías masivamente.
8. Regresar a la lista y enviar el plan a aprobación.

El tour es **totalmente navegable en ambos sentidos**: cada paso declara qué
hacer al pulsar *Siguiente* y, cuando aplica, qué hacer al pulsar *Anterior*.

### Qué es reutilizable y qué no

| Artefacto | ¿Reutilizable? | Dependencias |
| --- | :---: | --- |
| `TourService` | **Sí**, tal cual | `driver.js`, `rxjs` |
| `tour-driver.scss` | **Sí**, tal cual | CSS puro |
| `OVERLAY_DEFAULT_CONFIG` en `app.module.ts` | **Sí**, con adaptación | Angular CDK ≥ 21 |
| Patrón de archivo `*.tour.ts` | **Sí**, con adaptación | El framework host |
| Definición de los 32 pasos | **No** | Reglas de negocio del PAA |
| Componente coordinador | **No** | Rutas, servicios y fila demo del PAA |

> El `TourService` no importa **nada** de Angular Material, ni del módulo PAA.
> Eso es deliberado: es lo que permite copiarlo tal cual a otro sistema.

---

## 2. Arquitectura de la solución

```
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN                                               │
│                                                                      │
│  consulta-plan-auditoria.component.ts   ← coordinador del tour     │
│    · crea la fila de demostración                                    │
│    · abre/cierra el menú de acciones                                 │
│    · navega entre rutas                                              │
│    · decide qué acción ejecuta cada paso                             │
│                                                                      │
│  consulta-plan-auditoria.tour.ts        ← guion (32 pasos)          │
│    · no conoce servicios ni rutas                                    │
│    · recibe 3 callbacks: navegar, avanzar, retrocederA              │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA DE INFRAESTRUCTURA                                            │
│                                                                      │
│  shared/services/tour.service.ts     ← reusable en cualquier app     │
│    · instancia única de driver.js                                    │
│    · clic por fuera → destroy()                                      │
│    · continuación persistida entre rutas                             │
│    · tourFinalizado$ para que cada vista limpie su estado           │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA DE ESTILOS / PLATAFORMA                                       │
│                                                                      │
│  tour-driver.scss          ← neutraliza el velo, reactiva overlays   │
│  app.module.ts             ← usePopover: false (CDK 21)             │
│  angular.json              ← driver.css en estilos globales         │
│  *.html                    ← data-tour="..." como anclajes           │
└──────────────────────────────────────────────────────────────────────┘
```

### Orden de capas de la página

Un detalle que condiciona toda la solución: **driver.js vive fuera del sistema
de overlays de la aplicación**. Sus dos capas son hijas directas de `<body>`,
y sus `z-index` están fijados por la librería:

| Capa | `z-index` | Contenido |
| --- | ---: | --- |
| Página | `auto` | Componentes Angular normales |
| `.cdk-overlay-container` | `1000` | Menús, selects, dialogs de Material |
| `.driver-overlay` | `10000` | Overlay SVG con el *spotlight* (el "hueco") |
| `.driver-popover` | `1000000000` | Tarjeta del paso actual |

Que el overlay del tour quede **por encima** de los overlays de Material es
deseable: el hueco del SVG se dibuja sobre el menú o el modal, de modo que el
elemento enfocado queda iluminado y el resto del formulario queda opaco. Ese
mismo orden, sin embargo, hacía el contenido de los overlays **inservible**, y
por eso las correcciones de las secciones 4 y 5 son inseparables entre sí.

---

## 3. Instalación y configuración base

### 3.1 Dependencia

El proyecto usa **pnpm**:

```bash
pnpm install driver.js
```

Queda en `package.json`:

```json
"driver.js": "^1.8.0"
```

> No editar `pnpm-lock.yaml` a mano. Para regenerarlo: `pnpm install`.

### 3.2 Hoja de estilos de la librería

driver.js **no inyecta sus estilos**: si se olvida este paso, el tour funciona
pero se ve roto (sin popover, sin overlay, sin estados visuales).

En `angular.json`, el orden importa: `theme.scss` **antes** que `driver.css`,
para que nuestras reglas de `pointer-events` ganen sobre las de la librería.

```json
"styles": [
  "src/assets/styles/theme.scss",
  "node_modules/driver.js/dist/driver.css"
]
```

### 3.3 Variables de entorno de la implementación

| Variable | Valor | Nota |
| --- | --- | --- |
| Puerto de desarrollo | `4203` | Definido en el script `start` |
| Arquitectura | Microfrontend **single-spa** | Requiere el Root levantado para probar el flujo completo |
| Angular | `^21.2.23` | Standalone APIs disponibles |
| Angular CDK / Material | `~21.2.14` | Ver sección 4 |

---

## 4. El problema de las capas: CDK 21 y el *top layer*

### 4.1 Qué cambió

A partir de **Angular/CDK 21**, los overlays de Material (dialogs, menús,
selects, tooltips) se inmediatan en el ***top layer*** del navegador mediante
la **HTML Popover API**, activada por defecto mediante `usePopover: true`.

El *top layer* es un espacio de compositing **por encima de todo el documento**:
gana a cualquier `z-index`, por alto que sea. Para una aplicación normal es la
decisión correcta (el overlay siempre se ve por encima de la página). Para una
librería de tours, es un problema: el `z-index: 10000` de driver.js deja de
servir y sus capas quedan **debajo** de cualquier menú o modal abierto.

### 4.2 El síntoma observado

Con un menú de Material abierto durante el tour:

- El *spotlight* ya no se veía (el menú se pintaba encima, opaco).
- El popover con las instrucciones quedaba tapado.
- Los menús y modales se veían "planos", sin el recorte del tour.

### 4.3 La solución: devolver los overlays a `z-index`

En `src/app/app.module.ts`:

```ts
import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';

@NgModule({
  // ...
  providers: [
    // ...otros providers
    // A partir de Angular/CDK 21 los overlays (dialogs, menus, selects, tooltips)
    // se inmediatan en el "top layer" del navegador mediante la Popover API, lo que
    // los pinta por encima de cualquier z-index (incluido el tour guiado de driver.js).
    // usePopover: false los devuelve a .cdk-overlay-container, donde el z-index vuelve
    // a ser controlable.
    { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } }
  ]
})
export class AppModule {}
```

Con esto el orden de la tabla de la sección 2 vuelve a ser real y gobernable.

> **En otros sistemas:** si el proyecto usa Angular CDK ≥ 21, este provider es
> **obligatorio** antes de intentar cualquier otra cosa. Es el primer paso del
> diagnóstico cuando un tour "no se ve" o "queda tapado".

### 4.4 Las reglas de `pointer-events`

Con el orden de capas corregido aparece el problema inverso: el `<path>` SVG del
overlay de driver.js **captura todos los clics**. Los menús y modales quedan
visibles pero inservibles, y los botones del popover quedan debajo del menú.

La corrección está en `src/assets/styles/tour-driver.scss`, que se importa desde
`theme.scss`:

```scss
// src/assets/styles/theme.scss
@use "@angular/material" as mat;
@use "./estilos-generales.scss";
@use "./tour-driver.scss";
```

```scss
// src/assets/styles/tour-driver.scss
body.driver-active {
  // 1. El overlay del tour queda como capa visual únicamente. Necesita
  //    `!important` porque driver.js asigna el `pointerEvents` del <path> con
  //    estilos inline, y sólo un `!important` en una hoja de estilos gana.
  .driver-overlay,
  .driver-overlay * {
    pointer-events: none !important;
  }

  // 2. El contenido de los overlays de Material debe seguir siendo usable
  //    durante el tour (abrir selects, escribir en los campos del modal...).
  //    Sólo se reactiva el `.cdk-overlay-pane`: los contenedores
  //    (`.cdk-overlay-container`, `.cdk-global-overlay-wrapper`) cubren todo el
  //    viewport y, si capturasen el clic, el resto de la página dejaría de ser
  //    clicable.
  .cdk-overlay-pane,
  .cdk-overlay-pane * {
    pointer-events: auto;
  }

  // 3. Los backdrops no deben cerrar el menú o el modal al hacer clic por
  //    fuera; el tour se encarga de finalizarlo.
  .cdk-overlay-backdrop {
    pointer-events: none;
  }
}
```

Tres reglas, tres responsabilidades:

1. **El velo del tour deja de capturar clics** → el contenido sigue usable.
2. **Los overlays de Material vuelven a ser interactivos** → menús, selects y
   formularios del tour se pueden usar.
3. **Los backdrops no capturan clics** → un clic por fuera no cierra el menú ni
   el modal; el tour decide qué significa "salir".

> Todas las reglas viven bajo `body.driver-active`, la clase que driver.js añade
> a `<body>` mientras el tour está activo. Fuera del tour, Material se comporta
> con normalidad.

### 4.5 La consecuencia inevitable

La regla 3 tiene un efecto colateral que obliga a escribir código: **driver.js
ya no recibe el clic por fuera**, porque su overlay es `pointer-events: none`.
Por lo tanto `onOverlayClick` y la tecla `Esc` sobre el overlay dejan de ser
suficientes para cerrar el tour. Ese trabajo lo asume el `TourService`
(sección 5.3).

Este es un intercambio deliberado: preferimos que el tour sea *operable* (se
pueden usar los formularios que el propio tour abre) a que el tour se cierre
con cualquier clic accidental.

---

## 5. `TourService`: el servicio compartido

**Archivo:** `src/app/shared/services/tour.service.ts`
**Ámbito:** `providedIn: 'root'` — instancia única por aplicación.

### 5.1 API pública

| Miembro | Tipo | Propósito |
| --- | --- | --- |
| `iniciarTour(pasos, alFinalizar?)` | `(DriveStep[], () => void) => void` | Crea la instancia de driver.js, la inicia y registra el detector de clic externo |
| `getDriverObj()` | `() => Driver \| null` | Acceso a la instancia activa para `moveNext()` / `movePrevious()` |
| `tourFinalizado$` | `Observable<void>` | Emite cuando el tour se destruye (Finalizar, X, Esc o clic externo) |
| `marcarContinuacionTrasNavegar(direccion, selector)` | `('previous' \| 'next', string) => void` | Deja registrado que el tour debe continuar al terminar de renderizar la página de destino |
| `continuarTourSiCorresponde()` | `() => void` | Lo invoca la **página de destino**; reanuda el tour |
| `driverObj` | `Driver \| null` | Instancia activa, expuesta por comodidad |

### 5.2 Configuración común

```ts
this.driverObj = driver({
  showProgress: true,
  allowKeyboardControl: true,   // habilita Esc y flechas de teclado
  allowClose: true,             // habilita la X del popover
  overlayOpacity: 0.65,
  stagePadding: 8,
  nextBtnText: 'Siguiente',
  prevBtnText: 'Anterior',
  doneBtnText: 'Finalizar',
  steps: pasosTour,
  onCloseClick: () => this.driverObj?.destroy(),
  onDestroyed: () => {
    this.desregistrarClicFuera();
    sessionStorage.removeItem(TourService.TOUR_NAVEGACION_KEY);
    // Se notifica antes de `alFinalizar` porque ese callback navega, y al
    // cambiar de ruta se destruyen los componentes que deben cerrar los
    // overlays que el tour dejó abiertos.
    this.tourFinalizadoSubject.next();
    alFinalizar?.();
  },
});
```

`iniciarTour` llama siempre a `desregistrarClicFuera()` **antes** de crear la
instancia nueva. Sin eso, reiniciar el tour acumularía listeners y un solo clic
destruiría varias veces la instancia anterior.

### 5.3 Cierre por clic externo

Como se explicó en 4.5, el overlay del tour no captura clics, así que el cierre
por clic externo se implementa con un listener propio en **fase capture**:

```ts
private static readonly CLIC_IGNORADO =
  '.driver-popover, .cdk-overlay-container, .driver-active-element';

private registrarClicFuera(): void {
  this.listenerClicFuera = (event: MouseEvent): void => {
    // Los clics que dispara el propio tour (boton.click()) no cuentan.
    if (!event.isTrusted) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest(TourService.CLIC_IGNORADO)) return;

    this.driverObj?.destroy();
  };

  document.addEventListener('click', this.listenerClicFuera, true);
}
```

Cada guarda responde a un problema concreto:

| Guarda | Por qué |
| --- | --- |
| `!event.isTrusted` | Los `HTMLElement.click()` que el propio tour dispara para abrir menús y modales son eventos sintéticos. Sin esta guarda, abrir un menú cerraría el tour. |
| `!(event.target instanceof Element)` | El target puede ser el `document` o un nodo de texto enShadow DOM; `closest()` no existiría. |
| `closest(CLIC_IGNORADO)` | Tres exclusiones: dentro del popover (es la UI del tour), dentro de cualquier overlay de Material (para no cerrar el menú o el modal que el tour acaba de abrir), y sobre el elemento enfocado (`.driver-active-element`, que puede tener hijos). |

El listener se registra en `iniciarTour` y se retira en `onDestroyed`, de modo
que **nunca sobrevive al tour**.

### 5.4 Continuación entre rutas

Este es el mecanismo que permite que el tour **cruce de página** sin quedarse
congelado. El problema real: si el paso 12 hace clic en "Registrar Auditorías",
el router cambia de ruta, el componente actual se destruye y el elemento del
siguiente paso **todavía no existe en el DOM**. Llamar a `moveNext()` en ese
momento hace que driver.js resalte un elemento *dummy* en el centro de la
pantalla.

```ts
/** Continuación pendiente de resolver, la consume la página de destino. */
private static readonly TOUR_NAVEGACION_KEY = 'paa-tour-navegacion';
private static readonly ESPERA_NAVEGACION_MS = 3000;
private static readonly INTERVALO_NAVEGACION_MS = 50;
```

**Quien va a salir del tour** marca la intención:

```ts
marcarContinuacionTrasNavegar(direccion: DireccionTour, selector: string): void {
  const continuacion: ContinuacionTour = { direccion, selector };
  sessionStorage.setItem(TourService.TOUR_NAVEGACION_KEY, JSON.stringify(continuacion));
}
```

**Quien va a recibirlo** la consume al terminar de inicializarse:

```ts
continuarTourSiCorresponde(): void {
  const continuacion = this.leerContinuacion();
  if (!continuacion) return;

  this.esperarElemento(continuacion.selector, () => {
    if (continuacion.direccion === 'previous') {
      this.driverObj?.movePrevious();
      return;
    }
    this.driverObj?.moveNext();
  });
}
```

Y la espera del DOM:

```ts
private esperarElemento(selector: string, alEncontrarlo: () => void): void {
  const limite = Date.now() + TourService.ESPERA_NAVEGACION_MS;

  const sondear = (): void => {
    // Si el elemento nunca aparece se mueve igual: es preferible un popover
    // apuntando a un elemento faltante que dejar el tour congelado en el paso
    // anterior, que ya quedó en una página destruida.
    if (document.querySelector(selector) || Date.now() >= limite) {
      alEncontrarlo();
      return;
    }
    setTimeout(sondear, TourService.INTERVALO_NAVEGACION_MS);
  };

  sondear();
}
```

Cuatro propiedades deliberadas:

1. **Sondeo, no `setTimeout` fijo.** Un `setTimeout(…, 300)` funciona en una
   máquina rápida y falla en una lenta o con la red con latencia. Sondear el
   selector es correcto por construcción.
2. **El selector viaja con la orden.** Quien marca la continuación es el
   *archivo de pasos*, que es el único que sabe cuál es el elemento del paso
   destino. Así el servicio no necesita saber nada del guion.
3. **La marca se consume siempre** (`leerContinuacion` la borra antes de
   actuar). Si el tour se cerró durante la navegación, la siguiente visita a esa
   página no salta de paso.
4. **Hay timeout de seguridad.** Si el elemento nunca aparece, el tour se mueve
   igual: un popover apuntando a un elemento faltante es un fallo visible y
   recuperable; un tour congelado en un paso cuya página ya no existe, no.

#### Alternativa nativa de driver.js

driver.js trae dos opciones propias para este problema:

| Opción | Qué hace | Por qué no se usó |
| --- | --- | --- |
| `waitForElement: <ms>` | Espera a que el elemento del paso aparezca antes de renderizar el popover | Resuelve el espera **dentro** de driver.js, pero no el momento de **cambiar de ruta**: el elemento del paso *siguiente* pertenece a otra página que aún no existe al hacer clic |
| `skipMissingElement: true` | Salta el paso si el elemento no aparece | Esconde los errores. Un tour que se salta pasos silenciosamente es peor que uno que falla visiblemente |

Se dejaron en `false` (valor por defecto) de forma deliberada: este tour
prefiere fallar de forma visible.

---

## 6. Anclajes `data-tour`: el contrato con el HTML

Los pasos **nunca** dependen de clases visuales ni de textos. Cada control que
se quiera explicar lleva un identificador estable:

```html
<button
  mat-raised-button
  color="primary"
  (click)="guardar()"
  data-tour="guardar-marco-general"
>
  <mat-icon>save</mat-icon>
  Guardar
</button>
```

Y el paso lo referencia por selector CSS:

```ts
{
  element: '[data-tour="guardar-marco-general"]',
  popover: {
    title: '10. Guardar cambios del Marco general del PAA',
    description: '...',
  },
}
```

### 6.1 Reglas para elegir el ancla

1. **Elemento propio y estable.** Preferir un contenedor semántico (`<section>`,
   `<form>`, un `div` con `data-tour`) a un `<div>` anónimo.
2. **El ancla debe seguir existiendo** aunque el contenido interno cambie. Si
   se ancla a un `<input>`, un cambio de layout lo rompe.
3. **Un ancla por concepto.** No reutilizar el mismo `data-tour` para dos
   controles distintos, aunque se explique el mismo concepto.
4. **Verificar que el elemento existe** antes de hacer clic o avanzar.
5. **Si se usa un selector posicional** (`nth-child`, `td:last-child`,
   `button:nth-child(2)`), documentar que el orden del DOM **es parte del
   contrato**: reordenar el menú de Material rompe el tour en silencio.

### 6.2 Catálogo actual de anclas

20 anclas en 7 plantillas:

| Ancla | Archivo | Paso |
| --- | --- | --- |
| `crear-paa` | `consulta-plan-auditoria.component.html` | 1 |
| `nuevo-paa` | `consulta-plan-auditoria.component.html` | 2 |
| `formulario-marco-general` | `registrar-plan.component.html` | 5–9 |
| `guardar-marco-general` | `registrar-plan.component.html` | 10 |
| `regresar-marco-general` | `plantilla-tarjeta-contenedora.component.html` | 11 y 31 |
| `add-auditoria` | `registrar-auditorias.component.html` | 13 |
| `form-add-auditoria` | `add-auditoria-modal.component.html` | 14, 15, 18–21 |
| `form-tipo-evaluacion-auditoria` | `add-auditoria-modal.component.html` | 16 |
| `form-macroprocesos-auditoria` | `add-auditoria-modal.component.html` | 17 |
| `guardar-auditoria` | `add-auditoria-modal.component.html` | 22 |
| `cancelar-auditoria` | `add-auditoria-modal.component.html` | 22 (cierre) |
| `descargar-plantilla` | `registrar-auditorias.component.html` | 23 |
| `cargue-masivo` | `registrar-auditorias.component.html` | 24 |
| `form-cargue-archivo` | `cargar-archivo.component.html` | 25 |
| `boton-subir-archivo` | `cargar-archivo.component.html` | 26 |
| `boton-cancelar-archivo` | `cargar-archivo.component.html` | 26 (cierre) |
| `ver-paa-pdf` | `registrar-auditorias.component.html` | 27 |
| `guardar-auditorias` | `registrar-auditorias.component.html` | 28 |
| `exportar-auditorias` | `registrar-auditorias.component.html` | 29 |
| `eliminar-auditorias-masiva` | `registrar-auditorias.component.html` | 30 |

> `regresar-marco-general` vive en un **componente compartido**
> (`plantilla-tarjeta-contenedora`) y por eso aparece en las dos páginas del
> tour. Esa reutilización es intencional: el botón "Regresar" es el mismo
> concepto en ambas vistas.

---

## 7. Definición de pasos: el archivo `*.tour.ts`

**Archivo:** `src/app/modules/programacion/components/consulta-plan-auditoria/consulta-plan-auditoria.tour.ts`

Separar el guion del componente permite leer y revisar el recorrido sin mezclarlo
con la lógica de negocio, y —lo más importante— **mantener el archivo de pasos
libre de dependencias**.

### 7.1 Contrato de entrada

La función recibe **tres** callbacks. Los selectores están centralizados en una
constante del mismo archivo.

```ts
import { type DriveStep } from 'driver.js';

export const TOUR_RETORNO_LISTA_KEY = 'paa-tour-retorno-lista';

/** Páginas del tour entre las que se puede retroceder. */
export type PaginaTour = 'marco-general' | 'registrar-auditorias';

const SELECTORES = {
  acciones: 'div[role="menu"]',
  botonAcciones: '[data-tour="nuevo-paa"] tbody tr:nth-child(1) td:last-child button',
  botonEditarMarco: 'div[role="menu"] button:nth-child(1)',
  botonRegistrarAuditorias: 'div[role="menu"] button:nth-child(2)',
  botonAgregarAuditoria: '[data-tour="add-auditoria"]',
  botonCancelarAuditoria: '[data-tour="cancelar-auditoria"]',
  botonCargueMasivo: '[data-tour="cargue-masivo"]',
  botonCancelarCargue: '[data-tour="boton-cancelar-archivo"]',
  // Botón de la cabecera de ambas páginas del tour, es el paso al que se vuelve.
  botonRegresarPagina: '[data-tour="regresar-marco-general"]',
};

export function crearPasosTour(
  navegar: (commands: string[]) => Promise<boolean>,
  avanzar: () => void,
  retrocederA: (pagina: PaginaTour, selector: string) => void
): DriveStep[] {
  /* ...32 pasos... */
}
```

| Callback | Responsabilidad | Quién lo implementa |
| --- | --- | --- |
| `navegar` | Cambiar de ruta | `Router` del componente |
| `avanzar` | `moveNext()` sobre la instancia activa | `TourService` |
| `retrocederA` | Volver a una página anterior **y** reanudar el tour | `TourService` + el componente |

`retrocerA` recibe la página y el selector del paso destino, porque el archivo de
pasos es el único que sabe cuál es el paso al que se retrocede. El componente
coordinador solo aporta la navegación.

### 7.2 Anatomía de un paso

```ts
{
  element: SELECTORES.botonEditarMarco,
  popover: {
    title: '4. Editar el marco general del PAA',
    description: 'Esta acción te permite modificar el marco general del PAA...',
    side: 'left',
    onNextClick: () => {
      const boton = document.querySelector(SELECTORES.botonEditarMarco) as HTMLElement | null;
      if (!boton) return;

      boton.click();
      setTimeout(avanzar, 300);
    },
  },
}
```

`side: 'left'` se usa cuando el popover aparece sobre el centro de la pantalla y
taparía el menú que el tour acaba de abrir.

### 7.3 Tres tipos de paso

| Tipo | Cuándo | Qué hace |
| --- | --- | --- |
| **Informativo** | El elemento ya está en la pantalla | Solo `element` + `title` + `description`. Sin callbacks. |
| **Con acción de entrada** | El siguiente paso requiere otro contexto (menú, modal, ruta) | `onNextClick` hace clic en el control real y avanza |
| **Con retroceso** | El paso anterior vive en otra página | `onPrevClick` llama `retrocederA(pagina, selector)` |

### 7.4 El patrón "clic + avanzar"

Este es el patrón que aparece en 12 de los 32 pasos:

```ts
onNextClick: () => {
  const boton = document.querySelector(SELECTORES.botonAgregarAuditoria) as HTMLElement | null;
  if (!boton) return;      // 1. ¿existe el control?

  boton.click();           // 2. usar la acción real, no replicarla
  setTimeout(avanzar, 400); // 3. dar tiempo al overlay
}
```

Tres reglas que este patrón respeta:

1. **Se hace clic en el botón real**, nunca se replica su lógica. El tour
   ejercita el mismo código que el usuario; si el tour funciona, la pantalla
   funciona.
2. **Se verifica la existencia** del control antes de actuar: un `click()` sobre
   `null` es un `TypeError` que aborta el handler en silencio.
3. **El retardo cubre solo la creación del overlay.** Para abrir un *dialog* de
   Material basta; para **cambiar de ruta** no, y ahí se usa el mecanismo de
   continuación de la sección 5.4.

> Los pasos que avanzan sin navegar usan `setTimeout`. Cuando hay navegación,
> `setTimeout` es una fuente clásica de intermitencia: la sección 5.4 existe
> precisamente para no depender de ese retardo.

---

## 8. Coordinación de navegación entre rutas

El tour usa **dos** mecanismos de retorno, cada uno con un propósito distinto.

### 8.1 Retorno a la lista: `TOUR_RETORNO_LISTA_KEY`

Cuando el tour pasa de una página de detalle **a la lista** (pasos 5→4, 11→12,
13→12, 31→32), la lista debe **reabrir el menú de acciones** de la fila de
demostración, porque los pasos 4, 12 y 32 apuntan a botones *dentro* de ese
menú.

```ts
// Archivo de pasos (paso 11)
onNextClick: () => {
  sessionStorage.setItem(TOUR_RETORNO_LISTA_KEY, 'next');
  navegar(['/programacion/plan-auditoria']);
}
```

```ts
// consulta-plan-auditoria.component.ts
private continuarTourEnListaSiCorresponde(): void {
  const direccionTour = sessionStorage.getItem(TOUR_RETORNO_LISTA_KEY);
  if (!direccionTour) return;

  setTimeout(() => {
    const botonAcciones = document.querySelector(
      '[data-tour="nuevo-paa"] tbody tr:nth-child(1) td:last-child button'
    ) as HTMLButtonElement;

    if (!botonAcciones) return;

    botonAcciones.click();
    sessionStorage.removeItem(TOUR_RETORNO_LISTA_KEY);
    if (direccionTour === 'previous') {
      this.tourService.getDriverObj()?.movePrevious();
    } else {
      this.tourService.getDriverObj()?.moveNext();
    }
  }, 300);
}
```

El valor `"previous"` o `"next"` indica el sentido. Se invoca al terminar de
cargar la tabla (`cargarPlanesAuditoria`, línea 191).

> Es el mecanismo **más antiguo** de los dos y funciona porque la fila de
> demostración y su botón de acciones ya están renderizados al resolver la
> respuesta de la API. Se dejó tal cual para no arriesgar los flujos que ya
> estaban verificados. Un sistema nuevo debería usar el mecanismo de 8.2 para
> ambos casos, por ser más robusto.

### 8.2 Retroceso entre páginas: continuación del `TourService`

El caso inverso: el tour está en la **lista** (con el menú abierto) y el usuario
pulsa *Anterior* para volver a la página de detalle.

```ts
// Archivo de pasos (paso 12)
onPrevClick: () => retrocederA('marco-general', SELECTORES.botonRegresarPagina),
```

```ts
// consulta-plan-auditoria.component.ts
private retrocederEnElTour(pagina: PaginaTour, selector: string): void {
  const plan = this.crearFilaTour();
  this.tourService.marcarContinuacionTrasNavegar('previous', selector);

  if (pagina === 'marco-general') {
    this.editarReporte(plan);
    return;
  }

  this.editarActividades(plan);
}
```

Y la página de destino, en su `ngOnInit`:

```ts
// registrar-plan.component.ts
if (this.planId === '-1') {
  this.datosCargados = true;
  this.tourService.continuarTourSiCorresponde();
  return;
}
// ... al final del flujo normal, también
this.tourService.continuarTourSiCorresponde();
```

Se invoca en **ambas ramas** (plan de demostración y plan real) porque un tour
puede desplazarse a un plan real del usuario.

### 8.3 Por qué reusar los métodos de navegación del componente

`retrocederEnElTour` **no** construye la URL a mano. Llama a `editarReporte()` y
`editarActividades()`, los mismos métodos que usa el menú de acciones, porque
ellos hacen trabajo invisible pero indispensable:

```ts
editarReporte(element: any) {
  localStorage.setItem('vigencia', element.vigencia);
  this.router.navigate([`/programacion/plan-auditoria/editar/`, element.id]);
}

editarActividades(element: any, extraEdit?: boolean) {
  localStorage.setItem('vigencia', JSON.stringify({ Id: element.vigenciaId, Nombre: element.vigencia }));
  if (extraEdit) localStorage.setItem('extra-edit', 'true');
  this.router.navigate([`/programacion/plan-auditoria/registrar-auditorias/`, element.id]);
}
```

Si el tour construyera las URLs por su cuenta, saltaría el `localStorage` y las
páginas de destino se renderizarían **sin vigencia**. Duplicar esa lógica es la
forma más rápida de introducir un bug que solo aparece dentro del tour.

### 8.4 El ciclo ida y vuelta

El retroceso no es un callejón sin salida: al pulsar *Siguiente* en el paso de
retorno, el flujo anterior (`TOUR_RETORNO_LISTA_KEY`) reactiva la lista, reabre
el menú y devuelve el tour al paso de origen.

```
Paso 12 ──Anterior──▶ Editar Marco General ──▶ Paso 11
   ▲                                              │
   └──────────── Siguiente ────▶ lista + menú ─────┘

Paso 32 ──Anterior──▶ Añadir Auditorías ──▶ Paso 31
   ▲                                              │
   └──────────── Siguiente ────▶ lista + menú ─────┘
```

---

## 9. El componente coordinador

**Archivo:** `src/app/modules/programacion/components/consulta-plan-auditoria/consulta-plan-auditoria.component.ts`

Es el único punto que conoce a la vez el guion, las rutas y los servicios.

### 9.1 Botón de inicio

```html
<button
  mat-stroked-button
  color="primary"
  type="button"
  class="tour-button"
  aria-label="Iniciar recorrido guiado del Plan Anual de Auditorías"
  matTooltip="Conoce las opciones principales de esta vista"
  (click)="iniciarTourGuiado()"
>
  <mat-icon>tour</mat-icon>
  <span>Iniciar recorrido</span>
</button>
```

### 9.2 Punto de entrada

```ts
iniciarTourGuiado(): void {
  this.mostrarFilaTour = true;
  this.actualizarDatosTabla();

  const pasosTour = crearPasosTour(
    (commands) => this.router.navigate(commands),
    () => this.tourService.getDriverObj()?.moveNext(),
    (pagina, selector) => this.retrocederEnElTour(pagina, selector)
  );

  this.tourService.iniciarTour(pasosTour, () => {
    this.finalizarTour();
    this.router.navigate([`/programacion/plan-auditoria`]);
  });
}
```

El `alFinalizar` cumple dos funciones: limpiar el estado temporal y **devolver al
usuario a la lista** sin importar en qué página esté el tour.

### 9.3 Responsabilidades

1. Inyectar `TourService` e importar `crearPasosTour`.
2. Suscribirse a `tourFinalizado$` para limpiar la fila de demostración.
3. Crear y destruir la fila temporal que el tour necesita.
4. Proveer los tres callbacks del guion.
5. Limpiar las claves de `sessionStorage`.

---

## 10. Datos de demostración y protecciones

### 10.1 La fila de demostración

El tour necesita una fila de un PAA en estado *Borrador* sobre la cual mostrar
las acciones. Para no exigirle datos previos al usuario, el componente mantiene
dos estados:

```ts
private planesReales: Plan[] = [];
private mostrarFilaTour = false;

private actualizarDatosTabla(): void {
  this.dataSource.data = this.mostrarFilaTour
    ? [this.crearFilaTour(), ...this.planesReales]
    : this.planesReales;
}
```

```ts
private crearFilaTour(): Plan {
  return {
    id: -1,
    creadoPor: 'Usuario de demostracion',
    vigencia: '2026',
    fechaCreacion: '2026-01-01',
    colorEstado: this.escogerEmojiColorEstado('Borrador'),
    estado: 'Borrador',
    estadoId: environment.PLAN_ESTADO.EN_BORRADOR_ID,
    vigenciaId: 0,
    acciones: this.getAccionesPorRolYEstado(environment.PLAN_ESTADO.EN_BORRADOR_ID),
  } as Plan;
}
```

`mostrarFilaTour` se reactiva sola al volver a la lista:

```ts
this.mostrarFilaTour = sessionStorage.getItem(TOUR_RETORNO_LISTA_KEY) !== null;
```

### 10.2 El identificador mágico `-1` y sus cuatro guardas

El tour **simula clics reales**. Eso es su mayor ventaja (prueba el flujo de
verdad) y su mayor riesgo (podría crear datos falsos en producción). La defensa
es un identificador claramente distinguible más **una guarda en cada punto donde
el id ficticio podría llegar al backend**:

| Ubicación | Guarda |
| --- | --- |
| `registrar-plan.component.ts:50` | Si `planId === '-1'`, renderiza el formulario vacío y no consulta el plan |
| `registrar-plan.component.ts:155` | `if (this.planId === '-1') return;` antes de guardar |
| `registrar-auditorias.component.ts:103` | `if (id !== '-1') this.cargarAuditorias();` |
| `registrar-auditorias.component.ts:133` | `if (id === '-1') return;` dentro de `cargarAuditorias()` |
| `add-auditoria-modal.component.ts:222` | `if (this.data.planAuditoriaId === '-1') return;` antes de guardar |

**Regla general:** toda acción de guardar, cargar o consultar debe rechazar ese
identificador. Si en el futuro se agrega un paso nuevo al tour, la revisión debe
incluir una nueva guarda.

---

## 11. Ciclo de vida, cierre y limpieza

El tour puede terminar de **cuatro** maneras. Las cuatro deben dejar la pantalla
limpia:

| Forma de cierre | Disparador | Limpieza |
| --- | --- | --- |
| **Finalizar** | Botón *Finalizar* del último paso | `onDestroyed` → `tourFinalizado$` + `alFinalizar` |
| **X del popover** | Botón de cerrar | `onCloseClick` → `destroy()` → igual que arriba |
| **Escape** | Teclado (`allowKeyboardControl: true`) | `destroy()` → igual que arriba |
| **Clic externo** | Listener propio del `TourService` (sección 5.3) | `destroy()` → igual que arriba |

### 11.1 Orden de `onDestroyed` (detalle crítico)

```ts
onDestroyed: () => {
  this.desregistrarClicFuera();
  sessionStorage.removeItem(TourService.TOUR_NAVEGACION_KEY);
  // Se notifica antes de `alFinalizar` porque ese callback navega, y al
  // cambiar de ruta se destruyen los componentes que deben cerrar los
  // overlays que el tour dejó abiertos.
  this.tourFinalizadoSubject.next();
  alFinalizar?.();
},
```

El orden importa. `alFinalizar` navega a la lista, y al cambiar de ruta se
destruye `RegistrarAuditoriasComponent`. Si `tourFinalizado$` se emitiera
*después*, la suscripción que cierra los dialogos ya no existiría y los modales
quedarían **huérfanos flotando sobre la página siguiente**.

### 11.2 Cierre de overlays al cancelar

Este fue un defecto real del tour: al cancelar con un clic externo, los modales
que el tour había abierto ("Añadir auditoría" y "Cargar archivo") **permanecían
abiertos**. La causa es que un `MatDialog` pertenece al overlay del documento, no
al componente que lo abrió; destruir el componente no lo cierra.

La corrección va en la vista que hospeda esos modales:

```ts
// registrar-auditorias.component.ts
async ngOnInit(): Promise<void> {
  // El tour abre los modales de "Añadir auditoría" y "Cargar archivo" sobre
  // esta vista, así que al cancelarlo hay que cerrarlos: si no quedan flotando
  // sobre una página que el tour ya abandonó.
  this.tourService.tourFinalizado$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => this.dialog.closeAll());

  // ...
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

**Por qué `closeAll()` es seguro aquí:**

- El tour solo está activo sobre páginas donde el usuario no abrió nada por su
  cuenta, así que cualquier diálogo abierto es del tour.
- Se cierra con resultado `undefined`; los `afterClosed()` de
  `CargarArchivoComponent` y `AddAuditoriaModalComponent` ya manejan ese caso con
  `result?.saved` / `if (result)`.
- Para el plan de demostración, `cargarAuditorias()` sale por su guarda sin llamar
  a la API.
- Ninguno de los dos modales tiene `ngOnDestroy` con efectos secundarios.

> `takeUntil(this.destroy$)` sigue la convención ya usada en
> `ConsultaPlanAuditoriaComponent`; es indispensable para no dejar la
> suscripción viva tras destruir el componente.

### 11.3 Inventario de limpieza

| Recurso | Dónde se limpia |
| --- | --- |
| Listener de clic externo | `desregistrarClicFuera()` en `onDestroyed` y al reiniciar el tour |
| `paa-tour-navegacion` | `onDestroyed` del servicio, y además al consumirla |
| `paa-tour-retorno-lista` | Al consumirla, en `finalizarTour()` y en `continuarTourEnListaSiCorresponde()` |
| Fila de demostración | `finalizarTour()` → `mostrarFilaTour = false` + `actualizarDatosTabla()` |
| Suscripciones | `takeUntil(this.destroy$)` + `ngOnDestroy` |
| Overlays abiertos | `tourFinalizado$` → `dialog.closeAll()` |
| `localStorage` (`vigencia`, `extra-edit`) | Lo consume la página de destino al inicializarse |

---

## 12. Implementar un tour en otro sistema

### 12.1 Checklist completo

**Fase A — Infraestructura (una sola vez por aplicación)**

- [ ] **1.** Instalar `driver.js`.
- [ ] **2.** Cargar `driver.css` en los estilos globales, **después** de la hoja
      de tema propia.
- [ ] **3.** Copiar `TourService` a `shared/services/`. Es el único artefacto que
      se reutiliza sin cambios.
- [ ] **4.** Copiar `tour-driver.scss` e importarlo en la hoja global.
- [ ] **5.** Si el proyecto usa Angular CDK ≥ 21, añadir
      `{ provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } }`.
      **Verificar que el spotlight se vea por encima de los modales.**
- [ ] **6.** Si hay microfrontends, decidir **dónde** se registra el
      `TourService` y cómo se aíslan las claves de `sessionStorage`
      (sección 13.4).

**Fase B — Diseño del guion**

- [ ] **7.** Recorrer el flujo real de negocio y decidir **qué se explica**. No
      se marca la pantalla completa: se marcan las decisiones que el usuario
      necesita tomar.
- [ ] **8.** Dividir en pasos pequeños. Regla práctica: **más de 15–20 pasos en un
      recorrido continuo, la tasa de abandono sube.** Dividir por secciones.
- [ ] **9.** Definir para cada paso: ancla, título, descripción, posición del
      popover, y a dónde va *Siguiente* y *Anterior*.
- [ ] **10.** Detectar qué pasos **cambian de ruta**. Esos son los que requieren
      continuación (sección 8.2).

**Fase C — Marcado de la interfaz**

- [ ] **11.** Añadir `data-tour` a cada ancla. Preferir contenedores semánticos.
- [ ] **12.** Verificar en el navegador que cada ancla existe con el selector
      exacto que se escribió. Los errores de tipeo en selectores son la causa #1
      de tours que "no avanza".

**Fase D — Integración**

- [ ] **13.** Crear el archivo `*.tour.ts` con el guion y los callbacks.
- [ ] **14.** Implementar en el coordinador los callbacks de navegación
      reutilizando **los métodos reales** del componente.
- [ ] **15.** Añadir la llamada a `continuarTourSiCorresponde()` en cada página de
      destino, en todas las ramas de inicialización.
- [ ] **16.** Suscribirse a `tourFinalizado$` en toda vista que abra overlays o
      tenga estado temporal.
- [ ] **17.** Si el tour necesita datos que el usuario no tiene, crear una fila o
      registro de demostración **y añadir las guardas** que impiden enviarlo al
      backend.

**Fase E — Verificación**

- [ ] **18.** Probar avanzar **y retroceder** en cada transición.
- [ ] **19.** Probar los cuatro cierres: *Finalizar*, X, `Esc` y clic externo.
- [ ] **20.** Verificar que en cada cierre no queda nada: filas demo, claves de
      `sessionStorage`, `localStorage`, modales abiertos, ruta actual.
- [ ] **21.** Revisar con textos largos y en resoluciones pequeñas (portátil
      1366×768, tablet, móvil).
- [ ] **22.** Probar con zoom del navegador al 150–200 %.
- [ ] **23.** Ejecutar `build`, `lint` y las pruebas del proyecto.

### 12.2 Mínimo absoluto: un tour informativo

Si solo se quiere resaltar controles de una pantalla estática, el mínimo es
esto y nada más:

```ts
import { type DriveStep } from 'driver.js';
import { TourService } from 'shared/services/tour.service';

export function pasosDemo(): DriveStep[] {
  return [
    {
      element: '[data-tour="crear-paa"]',
      popover: { title: 'Crear el PAA', description: 'Selecciona la vigencia e inicia el registro.' },
    },
    {
      element: '[data-tour="nuevo-paa"]',
      popover: { title: 'Nuevo PAA', description: 'Aquí aparecerán los planes registrados.' },
    },
  ];
}

// en el componente
this.tourService.iniciarTour(pasosDemo());
```

Todo lo demás de este documento es necesario **solo si** el tour interactúa con
la aplicación.

### 12.3 Decisiones de arquitectura para otros sistemas

| Decisión | Recomendación |
| --- | --- |
| ¿Dónde vive la instancia de driver.js? | En un servicio singleton, nunca en un componente. Evita reinicios accidentales. |
| ¿Dónde vive el guion? | En un archivo separado del componente. Permite revisarlo sin leer lógica de negocio. |
| ¿Cómo comunican el guion y la app? | Callbacks inyectados. El guion no debe importar servicios. |
| ¿Cómo se conserva el estado al cambiar de ruta? | `sessionStorage` con clave propia, o el mecanismo de estado global del proyecto. |
| ¿Cómo se detectan los elementos? | `data-tour`. Nunca clases visuales ni textos. |
| ¿Cómo se espera al DOM? | Sondeo del selector, o `waitForElement` de driver.js si no hay navegación. |
| ¿Cómo se cierra? | Un único punto (`onDestroyed`) que limpie todo, y `tourFinalizado$` para los subscribers. |

### 12.4 Notas para microfrontends (single-spa)

Este proyecto es un **microfrontend single-spa**, lo que introduce
consideraciones que no aparecen en una aplicación monolítica:

| Tema | Consideración |
| --- | --- |
| **Ámbito del `TourService`** | Cada microfrontend tiene su propio inyector. El `TourService` es único **por microfrontend**, no por página. Un tour no puede cruzar la frontera entre MFs sin un canal compartido. |
| **Claves de `sessionStorage`** | Son compartido por origen y pestaña. Hay que **namespacear** las claves (aquí: prefijo `paa-`) para que dos MFs con tours simultáneos no se pisen. |
| **Capas visuales** | El *top layer* y los `z-index` son **del documento**, no del MF. Un overlay de otro MF puede cubrir el tour de este. Por eso el `usePopover: false` importa también en el shell. |
| **Pruebas** | El flujo completo requiere el Root levantado; el MF aislado no reproduce la navegación. |
| **Reinicio automático** | Las guías de single-spa pueden remontar componentes. El tour debe ser robusto a que su componente coordinador se destruya y vuelva a crearse. |