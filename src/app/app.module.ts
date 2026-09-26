import { NgModule } from "@angular/core";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from "@angular/common/http";
import { SpinnerInterceptor } from "./core/intercerptors/spinner.interceptor";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SpinnerComponent } from "./shared/elements/components/spinner/spinner.component";
import { MAT_DATE_LOCALE, provideNativeDateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';

@NgModule({
    declarations: [AppComponent, SpinnerComponent],
    bootstrap: [AppComponent],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule
    ], 
    providers: [
        PlanAnualAuditoriaService,
        provideHttpClient(withInterceptors([SpinnerInterceptor])),
        provideHttpClient(withInterceptorsFromDi()),
        provideNativeDateAdapter(),
        { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
        { provide: MAT_DATE_FORMATS,
            useValue: {
                parse: { dateInput: 'dd/MM/yyyy' }, 
                display: { dateInput: 'dd/MM/yyyy' } 
            }
        },
        // A partir de Angular/CDK 21 los overlays (dialogs, menus, selects, tooltips)
        // se inmediatan en el "top layer" del navegador mediante la Popover API, lo que
        // los pinta por encima de cualquier z-index (incluido el tour guiado de driver.js).
        // usePopover: false los devuelve a .cdk-overlay-container, donde el z-index vuelve
        // a ser controlable.
        { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } }
    ]
})
export class AppModule {}
