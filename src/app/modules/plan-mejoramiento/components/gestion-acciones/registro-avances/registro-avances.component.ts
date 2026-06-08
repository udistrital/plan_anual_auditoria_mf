import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { Formulario } from 'src/app/shared/data/models/formulario.model';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { formularioDependencias, formularioInformacionAccion, formularioInformacionAuditoria } from './registro-avances.utilidades';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { forkJoin, of, switchMap } from 'rxjs';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/shared/services/alert.service';
import { UserService } from 'src/app/core/services/user.service';

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

  @ViewChildren("formularioDependenciasComp, formularioDependenciasComp2")
  formularioDependenciasComponent!: QueryList<FormularioDinamicoComponent>;
  formularioDependencias: Formulario = formularioDependencias;
  
  @ViewChildren("formularioDependenciasApoyoComp")
  formularioDependenciasApoyoComponent!: QueryList<FormularioDinamicoComponent>;
  formularioDependenciasApoyo: Formulario = formularioDependencias;

  formularioCalificacion: FormGroup;

  accionId!: string;
  
  accion: any = null;
  hallazgo: any = null;
  auditoria: Auditoria | null = null;
  dependenciasApoyo: any[] = [];
  auditores: string[] = [];

  habilitado = true;
  calificado = false;

  nombreAuditor = 'Juan Pablo Moreno';
  usuarioId = 0;
  fechaCalificacion = new Date();

  tooltips = {
    avance: "*De contar con un indicador que permita su medición, se realizará conforme a la evidencia entregada y enconcordancia con la acción formulada. *En caso que el indicador no sea coherente con la acción, el % de esta columna será el resultado del análisis de la evidencia que corresponda a la ejecución de la acción.",
    observaciones: "El análisis debe realizarse de manera completa, suficiente y descriptiva con el fin de contar con un diagnóstico que evidencie el estado real de la acción, en qué momento de desarrollo se encuentra, que soportes se presentaron y evaluaron."
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaCrud: PlanAnualAuditoriaService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly alertService: AlertService,
    private readonly userService: UserService,
  ) {
    this.formularioCalificacion = this.fb.group({
      criterio: ['', [Validators.required]],
      calificacion: [0, [Validators.required]],
      observaciones: ['', [Validators.required]],
    })
  }

  get criterio() {
    return this.formularioCalificacion.get('criterio');
  }

  get calificacion() {
    return this.formularioCalificacion.get('calificacion');
  }

  get observaciones() {
    return this.formularioCalificacion.get('observaciones');
  }

  ngOnInit(): void {
    this.cargarFormularios();
    this.accionId = this.route.snapshot.paramMap.get("id")!;
    this.obtenerDatos(this.accionId);
    this.userService.getPersonaId().then(id => {
      this.usuarioId = id;
    });
  }

  obtenerDatos(accionId: string) {
    this.planAuditoriaCrud.get(`accion-mejora?query=_id:${accionId}&populate=true`).pipe(
      switchMap((res: any) => {
        this.accion = res?.Data[0];
        this.hallazgo = this.accion?.hallazgo_id;
        return forkJoin({
          auditoria: this.planAuditoriaMid.get(`auditoria/${this.hallazgo?.auditoria_id}`),
          responsables: this.planAuditoriaMid.get(`responsable-accion?query=activo:true,accion_mejora_id:${accionId}`),
        })
      }),

      switchMap((res: any) => {
        this.auditoria = res.auditoria?.Data;
        this.dependenciasApoyo = res.responsables?.Data || [];
        return this.planAuditoriaMid.get(`plan-mejoramiento-auditor?query=plan_mejoramiento_id:${this.accion?.plan_mejoramiento_id?._id}`);
      }),

      switchMap((res: any) => {
        this.auditores = res?.Data?.map((auditor: any) => auditor?.auditor_nombre) || [];
        return of([])
      })
    ).subscribe(() => {
      this.changeDetector.detectChanges();
      this.cargarFormulariosConAuditoria();
    });
  }

  cargarFormularios() {
    this.formularioInformacionAuditoria = formularioInformacionAuditoria;
    this.formularioInformacionAccion = formularioInformacionAccion;
    this.formularioDependencias = formularioDependencias;
    this.formularioDependenciasApoyo = formularioDependencias;
  }

  cargarFormulariosConAuditoria() {
    this.formularioInformacionAuditoriaComp.form.patchValue({
      consecutivo_no_auditoria: this.auditoria?.consecutivo_no_auditoria,
      tipo_evaluacion: this.auditoria?.tipo_evaluacion_nombre,
      titulo: this.auditoria?.titulo,
      numero_hallazgo: '1.1.1',
      descripcion_hallazgo: this.hallazgo?.descripcion,
      causa_hallazgo: 'this.hallazgo?.criterio no es',
    });

    this.formularioInformacionAccionComp.form.patchValue({
      no_accion: this.accion?.no_accion,
      tipo_accion: this.accion?.tipo_id,
      fecha_inicio: this.accion?.fecha_inicio,
      fecha_fin: this.accion?.fecha_fin,
      nombre_indicador: this.accion?.nombre_indicador,
      formula_indicador: this.accion?.formula_indicador,
      meta: this.accion?.meta,
      descripcion: this.accion?.descripcion,
    });

    this.formularioDependenciasComponent.forEach((comp, i) => {
      const dep = this.auditoria?.datos_dependencias[i];
      comp.form.patchValue({
        jefe_nombre: dep?.jefe_nombre,
        asistente_nombre: dep?.asistente_nombre,
      });
    });

    this.formularioDependenciasApoyoComponent.forEach((comp, i) => {
      const dep = this.dependenciasApoyo[i];
      comp.form.patchValue({
        jefe_nombre: dep?.jefe_nombre,
        asistente_nombre: dep?.asistente_nombre,
      });
    });
  }

  agregarDocumento() {

  }


  agregarCalificacion() {

  }

  guardarCalificacion() {
    this.alertService.showConfirmAlert('¿Está seguro de calificar la acción?').then(res => {
      if (res.isConfirmed) {
        this.calificado = true;
        const calificacion = this.formularioCalificacion.value;
        console.log('Calificación guardada:', calificacion);
        this.alertService.showSuccessAlert('La calificación ha sido registrada.');
      }
    });
  }

  regresar() {
    this.router.navigate(['/plan-mejoramiento']);
  }

}
