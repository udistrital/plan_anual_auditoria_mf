import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OikosService } from 'src/app/core/services/oikos.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { RolService } from 'src/app/core/services/rol.service';
import { UserService } from 'src/app/core/services/user.service';
import { HallazgoTabla } from '../tabla-hallazgos/tabla-hallazgos.component';

export interface DatosModalRemitirHallazgo {
  hallazgo: HallazgoTabla;
  auditoria: any;
}

export type ResultadoModalRemitirHallazgo = true;

export interface Dependencia {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-modal-remitir-hallazgo',
  templateUrl: './modal-remitir-hallazgo.component.html',
  styleUrls: ['./modal-remitir-hallazgo.component.css'],
  standalone: false,
})
export class ModalRemitirHallazgoComponent implements OnInit {
  form!: FormGroup;
  dependencias: Dependencia[] = [];
  cargandoDependencias = false;

  get dependenciaActual(): string {
    return this.data.auditoria?.dependencia_nombre ?? 'Sin dependencia';
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosModalRemitirHallazgo,
    private readonly dialogRef: MatDialogRef<ModalRemitirHallazgoComponent>,
    private readonly fb: FormBuilder,
    private readonly alertService: AlertService,
    private readonly oikosService: OikosService,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      dependenciaDestino: [null, Validators.required],
      observacion: ['', Validators.required],
    });
    this.cargarDependencias();
  }

  private cargarDependencias(): void {
    this.cargandoDependencias = true;
    this.oikosService.get('dependencia?limit=0&query=Activo:true').subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res.Data ?? []);
        this.dependencias = lista.map((d: any) => ({
          id: d.Id ?? d.id,
          nombre: d.Nombre ?? d.nombre,
        }));
        this.cargandoDependencias = false;
      },
      error: () => { this.cargandoDependencias = false; },
    });
  }

  remitir(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.alertService.showConfirmAlert(
      '¿Está seguro(a) de remitir este hallazgo? Esta acción no se puede deshacer.'
    ).then(async conf => {
      if (!conf.value) return;

      const { dependenciaDestino, observacion } = this.form.value;
      const usuarioId = await this.userService.getPersonaId();
      const usuarioRol = this.rolService.getRolPrioritario(this.rolService.getRoles());

      const dependenciaOrigenId = Array.isArray(this.data.auditoria?.dependencia_id)
        ? this.data.auditoria.dependencia_id[0]
        : (this.data.auditoria?.dependencia_id ?? 0);

      const body = {
        hallazgo_id: this.data.hallazgo.hallazgoId,
        dependencia_origen_id: dependenciaOrigenId,
        dependencia_destino_id: [dependenciaDestino.id],
        usuario_id: usuarioId,
        usuario_rol: usuarioRol,
        observacion,
        estado: 'pendiente',
        activo: true,
      };

      this.planAuditoriaService.post('hallazgo-remision', body).subscribe({
        next: () => {
          this.alertService.showSuccessAlert(
            `Hallazgo remitido exitosamente a ${dependenciaDestino.nombre}`
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al remitir hallazgo:', err);
          this.alertService.showErrorAlert('Error al remitir el hallazgo. Intente nuevamente.');
        },
      });
    });
  }
}
