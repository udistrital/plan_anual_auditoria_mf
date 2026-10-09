import { NgModule, provideZoneChangeDetection } from "@angular/core";
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
        
        provideZoneChangeDetection(),
        PlanAnualAuditoriaService,
        
        provideHttpClient(
            withInterceptors([SpinnerInterceptor]),
            withInterceptorsFromDi()
        ),
        provideNativeDateAdapter(),
        // CDK 21 abre los overlays como popover (top layer) y quedan encima del spinner y de SweetAlert
        { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } },
        { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
        { provide: MAT_DATE_FORMATS,
            useValue: {
                parse: { dateInput: 'dd/MM/yyyy' }, 
                display: { dateInput: 'dd/MM/yyyy' } 
            }
        }
    ]
})
export class AppModule {}
