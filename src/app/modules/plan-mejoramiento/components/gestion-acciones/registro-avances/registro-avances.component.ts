import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { Formulario } from 'src/app/shared/data/models/formulario.model';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { formularioDependencias, formularioInformacionAccion, formularioInformacionAuditoria } from './registro-avances.utilidades';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/shared/services/alert.service';
import { UserService } from 'src/app/core/services/user.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { CargarArchivoComponent } from 'src/app/shared/elements/components/cargar-archivo/cargar-archivo.component';
import { environment } from 'src/environments/environment';
import { ModalVerDocumentoComponent } from 'src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component';
import { HistorialRechazosData, ModalHistorialRechazosComponent } from 'src/app/shared/elements/components/dialogs/modal-historial-rechazos/modal-historial-rechazos.component';
import { RolService } from 'src/app/core/services/rol.service';
import { ReferenciaPdfService, DocumentoReferenciaPdf } from 'src/app/core/services/referencia-pdf.service';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { DescargaService } from 'src/app/shared/services/descarga.service';

interface DocumentoAvances extends DocumentoReferenciaPdf {
  tipoArchivo: string;
  usuario: string;
  rol: string;
  archivo?: File
}

interface Calificacion {
  _id?: string;
  accion_mejora_id: string;
  auditor_id: number;
  calificacion: number;
  criterio_evaluacion?: number;
  observacion: string;
  fecha_calificacion: Date;
  actual: boolean;
  activo?: boolean;
}

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

  @ViewChildren("formularioDependenciasComp2")
  formularioDependenciasComponent2!: QueryList<FormularioDinamicoComponent>;
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
  auditores: any[] = [];
  documentos: DocumentoAvances[] = [];
  calificacionActual: Calificacion | null = null;

  habilitado = true;
  aprobado = false;
  calificado = false;

  nombreAuditor = 'Juan Pablo Moreno';
  usuarioId = 0;
  roles: string[] = [];
  fechaAprobacion = new Date();
  fechaCalificacion = new Date();

  tooltips = {
    avance: "*De contar con un indicador que permita su medición, se realizará conforme a la evidencia entregada y enconcordancia con la acción formulada. *En caso que el indicador no sea coherente con la acción, el % de esta columna será el resultado del análisis de la evidencia que corresponda a la ejecución de la acción.",
    observaciones: "El análisis debe realizarse de manera completa, suficiente y descriptiva con el fin de contar con un diagnóstico que evidencie el estado real de la acción, en qué momento de desarrollo se encuentra, que soportes se presentaron y evaluaron."
  }

  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";

  constructor(
    private readonly breakpointObserver: BreakpointObserver,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaCrud: PlanAnualAuditoriaService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly alertService: AlertService,
    private readonly userService: UserService,
    private readonly rolService: RolService,
    private readonly dialog: MatDialog,
    private readonly referenciaService: ReferenciaPdfService,
    private readonly gestorDocumentalService: NuxeoService,
    private readonly descargaService: DescargaService
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
    this.manejarResponsiveStepper();
    this.accionId = this.route.snapshot.paramMap.get("id")!;
    this.obtenerDatos(this.accionId);
    this.userService.getPersonaId().then(id => {
      this.usuarioId = id;
    });
    this.roles = this.rolService.getRoles();
  }

  obtenerDatos(accionId: string) {
    forkJoin({
      accion: this.planAuditoriaCrud.get(`accion-mejora?query=_id:${accionId}&populate=true`),
      responsables: this.planAuditoriaMid.get(`responsable-accion?query=activo:true,accion_mejora_id:${accionId}`),
      calificacion: this.planAuditoriaCrud.get(`calificacion-accion?query=actual=true,accion_mejora_id:${accionId}`),
      documentos: this.referenciaService.consultarDocumentos(accionId, {
        tipo_id: environment.TIPO_DOCUMENTO_PARAMETROS.SOPORTE_AVANCE_ACCIONES,
        referenciaTipo: 'Auditoria',
        limit: 0
      }),
    }).pipe(
      switchMap(({accion, responsables, calificacion, documentos}) => {
        this.accion = accion?.Data[0];
        this.dependenciasApoyo = responsables?.Data || [];
        this.calificacionActual = calificacion?.Data[0] || null;
        if (this.calificacionActual !== null) {
          this.calificacionActual.fecha_calificacion = new Date(this.calificacionActual.fecha_calificacion)
        }
        this.documentos = documentos as DocumentoAvances[] || [];
        this.hallazgo = this.accion?.hallazgo_id;
        return forkJoin({
          auditoria: this.planAuditoriaMid.get(`auditoria/${this.hallazgo?.auditoria_id}`),
          auditores_plan: this.planAuditoriaMid.get(`plan-mejoramiento-auditor?query=plan_mejoramiento_id:${this.accion?.plan_mejoramiento_id?._id}`)
        })
      }),

      switchMap(({ auditoria, auditores_plan}) => {
        this.auditoria = auditoria?.Data;
        this.auditores = auditores_plan?.Data || [];
        if (this.esAuditorAsignado() && !this.calificacionActual) {
          this.formularioCalificacion.enable();
        }
        return of([]);
      }),

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
      numero_hallazgo: this.hallazgo?.no_hallazgo,
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

    this.formularioDependenciasComponent2.forEach((comp, i) => {
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

    this.formularioCalificacion.patchValue({
      criterio: this.calificacionActual?.criterio_evaluacion,
      calificacion: this.calificacionActual?.calificacion,
      observaciones: this.calificacionActual?.observacion,
    });
    if (this.calificacionActual) {
      this.formularioCalificacion.disable();
    }
  }

  habilitarCargue() {
    this.alertService.showConfirmAlert(
      '¿Está seguro de habilitar la subida de documentos al auditado?',
      'Habilitar subida de documentos'
    ).then((resp) => {
      if (resp.isConfirmed) {
        // Se debería ajustar una bandera en la acción
        this.habilitado = true;
      }
    });
  }

  deshabilitarCargue() {
    this.alertService.showConfirmAlert(
      '¿Está seguro de iniciar la revisión y deshabilitar la subida de documentos al auditado?',
      'Iniciar revisión de documentos'
    ).then((resp) => {
      if (resp.isConfirmed) {
        // Se debería ajustar una bandera en la acción
        this.habilitado = false;
      }
    });
  }

  agregarDocumento() {
    const ref = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: "pdf",
        id: this.accionId,
        cargaLambda: false,
        soloSeleccionar: true,
      }
    });
    ref.afterClosed().subscribe((data) => {
      if (data) {
        this.documentos.push(data?.documento)
      }
    })
  }

  async verDocumento(index: number) {
    const docSeleccionado = this.documentos[index]
    let base64Doc: string;
    if (docSeleccionado.nuxeo_enlace) {
      base64Doc = await this.gestorDocumentalService.obtenerPorUUID(docSeleccionado.nuxeo_enlace)
    } else {
      base64Doc = await this.gestorDocumentalService.fileABase64(docSeleccionado.archivo) as string
    }
    this.dialog.open(ModalVerDocumentoComponent, {
      width: "1000px",
      data: base64Doc,
      autoFocus: false,
    })
  }

  subirDocumento(index: number) {
    const archivo = this.documentos[index];
    const archivoSubir = {
      IdTipoDocumento: environment.TIPO_DOCUMENTO.PLAN_MEJORAMIENTO,
      nombre: archivo?.nombre,
      descripcion: "Soporte de avance de acciones del plan de mejoramiento",
      file: archivo.archivo,
    }
    this.alertService.showConfirmAlert(
      '¿Está seguro de guardar este documento? Si requiere modificarlo debe notificar al auditor',
      'Subir Documento'
    ).then((resp) => {
      if (resp.isConfirmed) {
        this.gestorDocumentalService.guardarArchivos([archivoSubir]).pipe(
          switchMap((nuxeoResp: any[]) => {
            console.log(nuxeoResp)
            const archivoGuardado = nuxeoResp[0]?.res;
            return this.referenciaService.guardarReferencia(
              archivoGuardado,
              "Auditoria",
              this.accionId,
              environment.TIPO_DOCUMENTO_PARAMETROS.SOPORTE_AVANCE_ACCIONES,
              undefined,
              true,
            )
          }),
          switchMap((referencia: any) => {
            this.documentos[index] = referencia?.Data as DocumentoAvances;
            return of(null)
          }),
          catchError((err) => {
            console.error(err)
            return of(null)
          })
        ).subscribe({
          next: () => this.alertService.showSuccessAlert('El archivo ha sido guardado con éxito.'),
          error: () => this.alertService.showErrorAlert('No se ha podido guardar el documento.')        
        });
      }
    });
  }

  async descargarDocumento(index: number) {
    const doc = this.documentos[index];
    const archivo = await this.gestorDocumentalService.obtenerPorUUID(doc.nuxeo_enlace);
    this.descargaService.descargarArchivo(archivo, doc.tipoArchivo ?? 'application/pdf', doc.nombre!)
  }

  eliminarDocumento(index: number) {
    this.alertService.showConfirmAlert(
      '¿Está seguro de eliminar este documento?',
      'Eliminar documento'
    ).then((resp) => {
      if (resp.isConfirmed) {
        const doc = this.documentos.splice(index, 1)[0];
        if (doc.nuxeo_enlace) {
          doc.activo = false;
          this.planAuditoriaCrud.put(`documento/${doc._id}`, doc).subscribe((res: any) => {
            if (res?.Success) this.alertService.showSuccessAlert('Documento eliminado con éxito.');
          });
        }
      }
    });
  }

  aprobarAvances() {
    this.alertService.showConfirmAlert('¿Está seguro de aprobar los avances de la acción?').then(res => {
      if (res.isConfirmed) {
        this.aprobado = true;
        this.habilitado = false;
        this.alertService.showSuccessAlert('La aprobación ha sido registrada.');
      }
    });
  }

  agregarCalificacion() {
    this.formularioCalificacion.enable();
    this.formularioCalificacion.patchValue({
      calificacion: 0,
      criterio: 0,
      observaciones: '',
    });
  }

  guardarCalificacion() {
    this.alertService.showConfirmAlert('¿Está seguro de calificar la acción?').then(res => {
      if (res.isConfirmed) {
        const calificacionForm = this.formularioCalificacion.value;
        const nuevaCalificacion: Calificacion = {
          accion_mejora_id: this.accionId,
          auditor_id: this.usuarioId,
          calificacion: calificacionForm.calificacion,
          observacion: calificacionForm.observaciones,
          criterio_evaluacion: calificacionForm.criterio, //TODO falta en el CRUD
          fecha_calificacion: new Date(),
          actual: true,
        }

        if (this.calificacionActual !== null) {
          this.calificacionActual.actual = false;
          this.planAuditoriaCrud.put(`calificacion-accion/${this.calificacionActual?._id}`, this.calificacionActual).subscribe(() => {})
        }

        this.planAuditoriaCrud.post('calificacion-accion', nuevaCalificacion).subscribe((res: any) => {
          this.calificacionActual = res?.Data;
          this.calificacionActual!.fecha_calificacion = new Date(this.calificacionActual!.fecha_calificacion)
          this.nombreAuditor = this.auditores.find(aud => aud.auditor_id === this.usuarioId).auditor_nombre;
          this.calificado = true;
          this.formularioCalificacion.disable();
          this.alertService.showSuccessAlert('La calificación ha sido registrada.');
        });
      }
    });
  }

  esAuditorAsignado(): boolean {
    return this.auditores.some(auditor => auditor.auditor_id === this.usuarioId);
  }

  regresar() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  manejarResponsiveStepper() {
    this.breakpointObserver
      .observe(["(max-width: 992px)"])
      .subscribe((result) => {
        this.orientation = result.matches ? "vertical" : "horizontal";
      });
  }

  abrirForo() {
    console.log(this.accion);
    this.dialog.open(ModalHistorialRechazosComponent, {
      width: '1000px',
      data: {
        auditoriaId: this.accionId,           // directo de la URL, se agrega momentaneamente como ejemplo
        estadoEndpoint: 'calificacion-accion', // Se debe ajustar a la ruta del endpoint de calificaciones
        auditoriaIdReferencia: 'accion_mejora_id', // Se debe ajustar a la referencia de la acción de mejora
        titulo: 'Foro de discusión',
        descripcion: `Historial del foro`,
      } as HistorialRechazosData,
      autoFocus: false,
    });
  }

}
