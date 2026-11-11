import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistrarPlanComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/registrar-plan/registrar-plan.component';
import { VerPlanComponent } from './components/plan-de-mejoramiento/ver-plan/ver-plan.component';
import { GestionAccionesComponent } from './components/gestion-acciones/gestion-acciones.component';
import { RegistroAvancesComponent } from './components/gestion-acciones/registro-avances/registro-avances.component';
import { FormulacionPlanesComponent } from './components/formulacion-planes/formulacion-planes.component';

const routes: Routes = [
  {
    // Las opciones del menú y los enlaces guardados siguen llegando a estas dos rutas
    path: '',
    redirectTo: 'formulacion-planes',
    pathMatch: 'full',
  },
  {
    path: 'asignar-auditores',
    redirectTo: 'formulacion-planes',
    pathMatch: 'full',
  },
  {
    path: 'registrar-plan/:id',
    component: RegistrarPlanComponent,
  },
  {
    path: 'ver-plan/:id',
    component: VerPlanComponent,
  },
  {
    path: 'gestion-acciones',
    component: GestionAccionesComponent,
  },
  {
    path: 'gestion-acciones',
    children: [
      {
        path: 'registrar-avances/:id',
        component: RegistroAvancesComponent,
      },
      {
        // Misma vista: el auditor asignado al plan revisa las evidencias y califica
        path: 'revisar/:id',
        component: RegistroAvancesComponent,
      }
    ]
  },
  {
    path: 'formulacion-planes',
    component: FormulacionPlanesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlanesRoutingModule {}