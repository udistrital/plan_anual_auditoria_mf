import { NgModule } from "@angular/core";
import { MaterialModule } from "./modules/material.module";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { BasesComponent } from "./elements/components/bases/bases.component";
import { CargarArchivoComponent } from "./elements/components/cargar-archivo/cargar-archivo.component";
import { FormularioDinamicoComponent } from "./elements/components/formulario-dinamico/formulario-dinamico.component";
import { PlantillaTarjetaContenedoraComponent } from "./elements/templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component";

@NgModule({
  declarations: [
    BasesComponent,
    FormularioDinamicoComponent,
    CargarArchivoComponent,
    PlantillaTarjetaContenedoraComponent,
  ],
  imports: [CommonModule, FormsModule, MaterialModule, ReactiveFormsModule],
  exports: [
    //Componentes
    BasesComponent,
    CargarArchivoComponent,
    FormularioDinamicoComponent,
    PlantillaTarjetaContenedoraComponent,
    //modulos
    FormsModule,
    DragDropModule,
    ReactiveFormsModule,
    PdfViewerModule,
  ],
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} }, // Proveedor para MAT_DIALOG_DATA
  ],
})
export class SharedModule {}
