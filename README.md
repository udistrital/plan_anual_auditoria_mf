# plan_anual_auditoria_mf

## Especificaciones Técnicas

### Tecnologías Implementadas y Versiones

- [Angular](https://angular.io/docs) 17.3.12
  - Incluye Animations, Common, Compiler, Core, Forms, Platform-Browser, Platform-Browser-Dynamic, Router
- [Angular Material](https://material.angular.io/) 17.3.10
- [RxJS](https://rxjs.dev/guide/overview) ~7.8.0
- [Single-spa](https://single-spa.js.org/) >=4.0.0
  - Incluye single-spa-angular
- [SweetAlert2](https://sweetalert2.github.io/) 11.12.4
- [ts-md5](https://github.com/cotag/ts-md5) 1.3.1
- [tslib](https://github.com/Microsoft/tslib) 2.3.0
- [Zone.js](https://github.com/angular/angular/tree/master/packages/zone.js) ~0.14.10


### Variables de Entorno


## Ejecución del Proyecto

Este proyecto es parte de una infraestructura de microfrontend implementada con la librería Single-SPA. Para ejecutarlo correctamente, es necesario levantar una aplicacion independiente: el **Root**.

### Root

El Root contiene la lógica de Sísifo

### Pasos para la Ejecución del Root

1. Clonar el repositorio del Root:

   ```bash
   git clone https://github.com/udistrital/auditoria_plan_mejoramiento_root_mf
   ```

2. Acceder al directorio del repositorio clonado:

   ```bash
   cd auditoria_plan_mejoramiento_root_mf
   ```

3. Instalar las dependencias:

   ```bash
   npm install
   ```

4. Iniciar el Root:
   ```bash
   npm start
   ```


### plan_anual_auditoria_mf

Microcliente de gestion de usuarios

### Pasos para la Ejecución del mf

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/udistrital/plan_anual_auditoria_mf
   ```

2. Acceder al directorio del repositorio clonado:

   ```bash
   cd plan_anual_auditoria_mf
   ```

3. Instalar las dependencias:

   ```bash
   npm install
   ```

4. Iniciar usuario_mf:

   ```bash
   npm run serve:single-spa:plan_anual_auditoria_mf
   ```

Con estos pasos, se tendrán las partes mínimas necesarias para ejecutar el proyecto en un entorno local.



## Ejecución Dockerfile

```bash
# Does not apply
```

## Ejecución docker-compose

```bash
# Does not apply
```

## Ejecución Pruebas

```bash
# Developing
```

## Estado CI

```bash
# Developing
```

[This file is part of plan_anual_auditoria_mf](LICENSE)

plan_anual_auditoria_mf is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (atSara Sampaio your option) any later version.

plan_anual_auditoria_mf is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with plan_anual_auditoria_mf. If not, see https://www.gnu.org/licenses/.