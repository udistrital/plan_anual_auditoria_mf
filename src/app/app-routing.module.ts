import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { APP_BASE_HREF } from "@angular/common";

const routes: Routes = [
  {
    path: "ejecucion",
    loadChildren: () =>
      import("./modules/ejecucion/ejecucion.module").then(
        (m) => m.EjecucionModule
      ),
  },
  {
    path: "planeacion",
    loadChildren: () =>
      import("./modules/planeacion/planeacion.module").then(
        (m) => m.PlaneacionModule
      ),
  },
  {
    path: "programacion",
    loadChildren: () =>
      import("./modules/programacion/programacion.module").then(
        (m) => m.ProgramacionModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: APP_BASE_HREF, useValue: "/gestion-auditoria/" }],
})
export class AppRoutingModule {}
