import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "src/app/core/_guards/auth.guard";

import { APP_BASE_HREF } from "@angular/common";

const routes: Routes = [
  {
    path: "planeacion",
    canActivate: [AuthGuard],
    loadChildren: () =>
      import("./modules/planeacion/planeacion.module").then(
        (m) => m.PlaneacionModule
      ),
  },
  {
    path: "programacion",
    canActivate: [AuthGuard],
    loadChildren: () =>
      import("./modules/programacion/programacion.module").then(
        (m) => m.ProgramacionModule
      ),
  },
  {
    path: "ejecucion",
    // canActivate: [AuthGuard],
    loadChildren: () =>
      import("./modules/ejecucion/ejecucion.module").then(
        (m) => m.EjecucionModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: APP_BASE_HREF, useValue: "/gestion-auditoria/" }],
})
export class AppRoutingModule {}
