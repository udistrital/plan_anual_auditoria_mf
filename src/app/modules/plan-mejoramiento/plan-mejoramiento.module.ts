import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { PlanesRoutingModule } from './plan-mejoramiento-routing.module';
import { PlanDeMejoramientoComponent } from './components/plan-de-mejoramiento/plan-mejoramiento.component';
import { TablaPlanMejoramientoComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/tabla-plan-mejoramiento.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    PlanDeMejoramientoComponent,
    TablaPlanMejoramientoComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    FormsModule,
    PlanesRoutingModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule,
  ]
})
export class PlanesModule { }