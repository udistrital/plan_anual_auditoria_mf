import { NgModule } from "@angular/core";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { provideHttpClient, withInterceptors, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { SpinnerInterceptor } from "./core/intercerptors/spinner.interceptor";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SpinnerComponent } from "./shared/elements/components/spinner/spinner.component";

@NgModule({ declarations: [AppComponent, SpinnerComponent],
    bootstrap: [AppComponent], imports: [AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule], providers: [
        PlanAnualAuditoriaService,
        provideHttpClient(withInterceptors([SpinnerInterceptor])),
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule {}
