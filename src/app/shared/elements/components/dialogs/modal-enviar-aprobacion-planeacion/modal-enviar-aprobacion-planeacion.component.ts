import { Component } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-modal-enviar-aprobacion-planeacion",
  templateUrl: "./modal-enviar-aprobacion-planeacion.component.html",
  styleUrls: ["./modal-enviar-aprobacion-planeacion.component.css"],
  standalone: false,
})
export class ModalEnviarAprobacionPlaneacionComponent {
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<ModalEnviarAprobacionPlaneacionComponent>
  ) {
    this.form = this.fb.group({
      observacion: [""],
    });

    this.dialogRef.beforeClosed().subscribe((result) => {
      if (result === undefined) {
        this.dialogRef.close(null);
      }
    });
  }

  confirmar(): void {
    this.dialogRef.close(this.form.value.observacion ?? "");
  }
}
