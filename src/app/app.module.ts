import { NgModule } from "@angular/core";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import {
  HttpClientModule,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import { SpinnerIntercerptor } from "./core/intercerptors/spinner.interceptor";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SpinnerComponent } from "./shared/elements/components/spinner/spinner.component";

@NgModule({
  declarations: [AppComponent, SpinnerComponent],
  imports: [
    HttpClientModule,
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
  ],
  providers: [
    PlanAnualAuditoriaService,
    provideHttpClient(withInterceptors([SpinnerIntercerptor])),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
