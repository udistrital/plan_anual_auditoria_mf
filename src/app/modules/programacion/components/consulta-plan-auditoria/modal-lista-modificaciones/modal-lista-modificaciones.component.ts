import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-lista-modificaciones',
  templateUrl: './modal-lista-modificaciones.component.html',
  styleUrl: './modal-lista-modificaciones.component.css'
})
export class ModalListaModificacionesComponent {
  modificaciones: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) private planAuditoria: any
  ) {}

  ngOnInit(): void {
    this.cargarModificaciones();
  }

  cargarModificaciones() {
    
  }

}
