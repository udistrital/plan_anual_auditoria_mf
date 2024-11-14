import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevisionJefeComponent } from './revision-jefe.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { PdfVisualizadorComponent } from './pdf-visualizador/pdf-visualizador.component';
import { SafeURLPipe } from '../../../@core/pipes/safeUrl.pipe';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { ModalGeneral } from './modal-general/modal-general';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [
    RevisionJefeComponent,
    PdfVisualizadorComponent,
    SafeURLPipe,
    ModalMotivosRechazoComponent,
    ModalGeneral,
  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatGridListModule,
    MatListModule,
    MatDialogModule,
    MatCardModule,
    PdfViewerModule,
  ],
})
export class RevisionJefeModule {}
