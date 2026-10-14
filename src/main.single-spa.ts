import { enableProdMode, NgZone, provideZoneChangeDetection } from '@angular/core';

import { platformBrowser } from '@angular/platform-browser';
import { Router, NavigationStart } from '@angular/router';

import { singleSpaAngular, provideSingleSpaPlatform } from 'single-spa-angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';

if (environment.production) {
  enableProdMode();
}

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    // Angular 21 arranca sin Zone.js por defecto; la app depende de Zone para refrescar la vista
    return platformBrowser(provideSingleSpaPlatform()).bootstrapModule(AppModule, {
      applicationProviders: [provideZoneChangeDetection()],
    });
  },
  template: '<plan-anual-auditoria-mf />',
  Router,
  NavigationStart,
  NgZone,
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
