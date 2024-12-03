import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-modal-lista-rechazos",
  templateUrl: "./modal-lista-rechazos.component.html",
  styleUrl: "./modal-lista-rechazos.component.css",
})
export class ModalListaRechazosComponent implements OnInit {
  rechazos: any[] = [];
  constructor(@Inject(MAT_DIALOG_DATA) private planAuditoria: any) {}

  ngOnInit(): void {
    this.rechazos = this.planAuditoria.rechazos;
    console.log(this.rechazos);
  }
}
