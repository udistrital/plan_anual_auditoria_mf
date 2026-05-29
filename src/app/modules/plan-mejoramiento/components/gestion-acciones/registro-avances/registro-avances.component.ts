import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { Formulario } from 'src/app/shared/data/models/formulario.model';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { formularioDependencias, formularioInformacionAccion, formularioInformacionAuditoria } from './registro-avances.utilidades';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';

@Component({
  selector: 'app-registro-avances',
  templateUrl: './registro-avances.component.html',
  styleUrl: './registro-avances.component.css',
  standalone: false,
})
export class RegistroAvancesComponent implements OnInit {
  @ViewChild("stepper") stepper!: MatStepper;

  @ViewChild("formularioInformacionAuditoriaComp")
  formularioInformacionAuditoriaComp!: FormularioDinamicoComponent;
  formularioInformacionAuditoria: Formulario | undefined;
  
  @ViewChild("formularioInformacionAccionComp")
  formularioInformacionAccionComp!: FormularioDinamicoComponent;
  formularioInformacionAccion: Formulario | undefined;

  @ViewChildren("formularioDependenciasComp")
  formularioDependenciasComponent!: QueryList<FormularioDinamicoComponent>;
  formularioDependencias: Formulario = formularioDependencias;

  auditoria!: Auditoria;
  auditoriaId!: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarFormularios();
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.obtenerDatos(this.auditoriaId);
  }

  obtenerDatos(auditoriaId: string) {
    this.planAuditoriaMid.get(`auditoria/${auditoriaId}`).subscribe((res) => {
      this.auditoria = res.Data;
      this.changeDetector.detectChanges();
      this.cargarFormulariosConAuditoria();
    });
  }

  cargarFormularios() {
    this.formularioInformacionAuditoria = formularioInformacionAuditoria;
    this.formularioInformacionAccion = formularioInformacionAccion;
    this.formularioDependencias = formularioDependencias;
  }

  cargarFormulariosConAuditoria() {
    this.formularioInformacionAuditoriaComp.form.patchValue({
      consecutivo_no_auditoria: this.auditoria.consecutivo_no_auditoria,
      tipo_evaluacion: this.auditoria.tipo_evaluacion_nombre,
      titulo: this.auditoria.titulo,
      numero_hallazgo: '1',
      descripcion_hallazgo: 'asdfg',
      causa_hallazgo: 'qwerty',
    });

    this.formularioInformacionAccionComp.form.patchValue({
      no_accion: '1',
      descripcion: 'Acción para corregir el hallazgo identificado en la auditoría.',
      auditor: 'Juan Pérez',
      fecha_compromiso: new Date(),
    });

    this.formularioDependenciasComponent.forEach((comp, i) => {
      const dep = this.auditoria.datos_dependencias[i];
      comp.form.patchValue({
        jefe_nombre: dep.jefe_nombre,
        asistente_nombre: dep.asistente_nombre,
      });
    });
  }




  regresar() {
    this.router.navigate(['/plan-mejoramiento']);
  }

}
