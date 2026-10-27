import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { catchError, EMPTY, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { UserService } from 'src/app/core/services/user.service';
import { CargarArchivoComponent } from 'src/app/shared/elements/components/cargar-archivo/cargar-archivo.component';
import { environment } from 'src/environments/environment';
import { ModalVerDocumentoComponent } from 'src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component';
import { RolService } from 'src/app/core/services/rol.service';
import { ReferenciaPdfService } from 'src/app/core/services/referencia-pdf.service';
import type { DocumentoReferenciaPdf } from 'src/app/core/services/referencia-pdf.service';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { DescargaService } from 'src/app/shared/services/descarga.service';
import { TercerosService } from 'src/app/shared/services/terceros.service';
import { CriterioEvaluacion, TIPOS_ACCION, criterioPorId, nombreRol } from './registro-avances.utilidades';
import { ValoresCalificacion } from './formulario-calificacion/formulario-calificacion.component';
import { DatosFichaAccion, PanelFichaAccionComponent, PestanaFicha } from './panel-ficha-accion/panel-ficha-accion.component';
import { CalificacionHistorial, PanelHistorialCalificacionesComponent } from './panel-historial-calificaciones/panel-historial-calificaciones.component';
import { PanelForoAccionComponent } from './panel-foro-accion/panel-foro-accion.component';

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

/** Configuración común de los paneles laterales (ficha, historial y foro). */
const CONFIG_PANEL_LATERAL: MatDialogConfig = {
  position: { right: '0', top: '0' },
  height: '100vh',
  width: '520px',
  maxWidth: '100vw',
  maxHeight: '100vh',
  panelClass: 'panel-lateral',
  autoFocus: 'dialog',
};

@Component({
  selector: 'app-registro-avances',
  templateUrl: './registro-avances.component.html',
  styleUrl: './registro-avances.component.css',
  standalone: false,
})
export class RegistroAvancesComponent implements OnInit {
  readonly nombreRol = nombreRol;

  accionId!: string;
  accion: any = null;
  hallazgo: any = null;
  auditoria: Auditoria | null = null;
  responsables: any[] = [];
  /** Auditores vigentes del plan: deciden quién revisa y califica. */
  auditores: any[] = [];
  /** Todos los auditores que ha tenido el plan: nombran al autor de calificaciones antiguas. */
  auditoresHistorial: any[] = [];
  documentos: DocumentoAvances[] = [];
  calificaciones: Calificacion[] = [];
  calificacionActual: Calificacion | null = null;

  cargando = true;
  errorCarga = false;
  habilitado = true;
  editandoCalificacion = false;
  guardandoCalificacion = false;

  usuarioId = 0;
  roles: string[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaCrud: PlanAnualAuditoriaService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly alertService: AlertService,
    private readonly userService: UserService,
    private readonly rolService: RolService,
    private readonly dialog: MatDialog,
    private readonly referenciaService: ReferenciaPdfService,
    private readonly gestorDocumentalService: NuxeoService,
    private readonly descargaService: DescargaService,
    private readonly tercerosService: TercerosService
  ) { }

  ngOnInit(): void {
    this.accionId = this.route.snapshot.paramMap.get("id")!;
    this.roles = this.rolService.getRoles();
    this.userService.getPersonaId()
      .then(id => {
        this.usuarioId = id;
        this.obtenerDatos(this.accionId);
      })
      .catch((err) => {
        // Sin persona_id (sesión vencida o borrada) no se puede decidir la variante: se ofrece reintentar
        console.error(err);
        this.errorCarga = true;
        this.cargando = false;
      });
  }

  // ─── Carga de datos ─────────────────────────────────────────────────────────

  obtenerDatos(accionId: string) {
    this.cargando = true;
    this.errorCarga = false;
    forkJoin({
      accion: this.planAuditoriaCrud.get(`accion-mejora?query=_id:${accionId}&populate=true`),
      responsables: this.planAuditoriaMid.get(`responsable-accion?query=activo:true,accion_mejora_id:${accionId}`),
      calificaciones: this.planAuditoriaCrud.get(`calificacion-accion?query=activo:true,accion_mejora_id:${accionId}&sortby=fecha_calificacion&order=desc&limit=0`),
      documentos: this.referenciaService.consultarDocumentos(accionId, {
        tipo_id: environment.TIPO_DOCUMENTO_PARAMETROS.SOPORTE_AVANCE_ACCIONES,
        referenciaTipo: 'Accion Mejora',
        limit: 0
      }),
    }).pipe(
      switchMap(({ accion, responsables, calificaciones, documentos }) => {
        this.accion = accion?.Data?.[0] ?? null;
        this.habilitado = Boolean(this.accion?.en_revision);
        this.hallazgo = this.accion?.hallazgo_id;
        this.responsables = responsables?.Data || [];
        this.calificaciones = (calificaciones?.Data || []).map((c: Calificacion) => ({
          ...c,
          fecha_calificacion: new Date(c.fecha_calificacion),
        }));
        this.calificacionActual = this.calificaciones.find(c => c.actual) ?? null;
        this.documentos = (documentos as DocumentoAvances[]) || [];
        this.completarDatosDocs();
        return forkJoin({
          auditoria: this.planAuditoriaMid.get(`auditoria/${this.hallazgo?.auditoria_id}`),
          // Todos los auditores del plan (también los retirados) para mostrar quién emitió cada calificación
          auditores_plan: this.planAuditoriaMid.get(`plan-mejoramiento-auditor?query=plan_mejoramiento_id:${this.accion?.plan_mejoramiento_id?._id}&limit=0`)
        });
      }),
      catchError((err) => {
        // Sin los auditores del plan no se sabe qué variante mostrar: se ofrece reintentar en lugar de una vista incompleta
        console.error(err);
        this.errorCarga = true;
        this.cargando = false;
        this.changeDetector.detectChanges();
        return EMPTY;
      }),
    ).subscribe(({ auditoria, auditores_plan }) => {
      this.errorCarga = false;
      this.auditoria = auditoria?.Data ?? null;
      this.auditoresHistorial = auditores_plan?.Data || [];
      // Solo los auditores vigentes califican: los retirados del plan quedan con activo:false
      this.auditores = this.auditoresHistorial.filter(a => a.activo);
      // Solo el auditor asignado al plan califica, y el formulario se abre si aún no hay calificación (G-03)
      this.editandoCalificacion = this.esAuditorAsignado() && !this.calificacionActual;
      this.cargando = false;
      this.changeDetector.detectChanges();
    });
  }

  completarDatosDocs() {
    for (const doc of this.documentos) {
      const metadata = doc.metadatos;
      doc.nombre = metadata?.['nombre'] || 'Sin nombre';
      doc.rol = metadata?.['rol'] || '';
      doc.usuario = metadata?.['creado_por'];
    }
  }

  // ─── Datos derivados para la vista ──────────────────────────────────────────

  get tipoAccionNombre(): string {
    return TIPOS_ACCION[this.accion?.tipo_id] ?? '—';
  }

  get dependenciasLideres(): any[] {
    const lideres = this.responsables.filter(r => r.dependencia_lider);
    return lideres.length ? lideres : (this.auditoria?.datos_dependencias ?? []);
  }

  get dependenciasApoyo(): any[] {
    return this.responsables.filter(r => !r.dependencia_lider);
  }

  get nombreDependencia(): string {
    return this.dependenciasLideres.map(d => d.dependencia_nombre).filter(Boolean).join(', ') || '—';
  }

  get nombreAuditoria(): string {
    if (!this.auditoria) return '';
    return this.auditoria.subtitulo ? `${this.auditoria.titulo} - ${this.auditoria.subtitulo}` : this.auditoria.titulo;
  }

  get documentosGuardados(): number {
    return this.documentos.filter(d => d.nuxeo_enlace).length;
  }

  get criterioActual(): CriterioEvaluacion | undefined {
    return criterioPorId(this.calificacionActual?.criterio_evaluacion);
  }

  nombreAuditor(auditorId: number): string {
    return this.auditoresHistorial.find(a => a.auditor_id === auditorId)?.auditor_nombre ?? 'Auditor de Control Interno';
  }

  esAuditorAsignado(): boolean {
    return this.auditores.some(auditor => auditor.auditor_id === this.usuarioId);
  }

  // ─── Cargue de evidencias (auditor) ─────────────────────────────────────────

  alternarCargue() {
    const habilitar = !this.habilitado;
    const [mensaje, titulo] = habilitar
      ? ['¿Está seguro de habilitar la subida de documentos al auditado?', 'Habilitar cargue']
      : ['¿Está seguro de bloquear el cargue para revisar? La dependencia no podrá subir documentos hasta que lo habilite de nuevo.', 'Bloquear cargue'];
    this.alertService.showConfirmAlert(mensaje, titulo).then((resp) => {
      if (!resp.isConfirmed) return;
      const accionPayload = {
        ...this.accion,
        en_revision: habilitar,
        plan_mejoramiento_id: this.accion?.plan_mejoramiento_id?._id ?? this.accion?.plan_mejoramiento_id,
        hallazgo_id: this.accion?.hallazgo_id?._id ?? this.accion?.hallazgo_id,
      };
      this.planAuditoriaCrud.put(`accion-mejora/${this.accionId}`, accionPayload).subscribe({
        next: () => {
          this.accion.en_revision = habilitar;
          this.habilitado = habilitar;
          this.alertService.showSuccessAlert(habilitar
            ? 'Se ha habilitado el cargue de documentos para esta acción.'
            : 'Se ha bloqueado el cargue de documentos para esta acción.');
        },
        error: () => this.alertService.showErrorAlert('No se pudo actualizar el estado del cargue.'),
      });
    });
  }

  // ─── Evidencias ─────────────────────────────────────────────────────────────

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
        const doc = data?.documento as DocumentoAvances;
        this.tercerosService.getTerceroById(this.usuarioId).subscribe(t => {
          doc.usuario = t?.NombreCompleto;
        });
        doc.rol = this.roles.filter(r => r in environment.ROL)[0];
        this.documentos.unshift(doc);
      }
    });
  }

  async verDocumento(index: number) {
    const docSeleccionado = this.documentos[index];
    let base64Doc: string;
    if (docSeleccionado.nuxeo_enlace) {
      base64Doc = await this.gestorDocumentalService.obtenerPorUUID(docSeleccionado.nuxeo_enlace);
    } else {
      base64Doc = await this.gestorDocumentalService.fileABase64(docSeleccionado.archivo) as string;
    }
    this.dialog.open(ModalVerDocumentoComponent, {
      width: "1000px",
      data: base64Doc,
      autoFocus: false,
    });
  }

  subirDocumento(index: number) {
    const archivo = this.documentos[index];
    const archivoSubir = {
      IdTipoDocumento: environment.TIPO_DOCUMENTO.PLAN_MEJORAMIENTO,
      nombre: archivo?.nombre,
      descripcion: "Soporte de avance de acciones del plan de mejoramiento",
      file: archivo.archivo,
    };
    const metadata = {
      creado_por: archivo.usuario,
      nombre: archivo?.nombre,
      rol: archivo.rol,
    };
    this.alertService.showConfirmAlert(
      '¿Está seguro de guardar este documento? Si requiere modificarlo debe notificar al auditor',
      'Guardar documento'
    ).then((resp) => {
      if (!resp.isConfirmed) return;
      this.gestorDocumentalService.guardarArchivos([archivoSubir]).pipe(
        switchMap((nuxeoResp: any[]) => {
          const archivoGuardado = nuxeoResp[0]?.res;
          return this.referenciaService.guardarReferencia(
            archivoGuardado,
            "Accion Mejora",
            this.accionId,
            environment.TIPO_DOCUMENTO_PARAMETROS.SOPORTE_AVANCE_ACCIONES,
            metadata,
            true,
          );
        }),
      ).subscribe({
        next: (referencia: any) => {
          // Se ubica por referencia: si mientras se subía se añadió otro archivo, el índice ya no es el mismo
          const posicion = this.documentos.indexOf(archivo);
          if (posicion >= 0) {
            this.documentos[posicion] = referencia?.Data as DocumentoAvances;
          }
          this.completarDatosDocs();
          this.alertService.showSuccessAlert('El archivo ha sido guardado con éxito.');
        },
        error: (err) => {
          console.error(err);
          this.alertService.showErrorAlert('No se ha podido guardar el documento.');
        },
      });
    });
  }

  async descargarDocumento(index: number) {
    const doc = this.documentos[index];
    const archivo = await this.gestorDocumentalService.obtenerPorUUID(doc.nuxeo_enlace);
    this.descargaService.descargarArchivo(archivo, doc.tipoArchivo ?? 'application/pdf', doc.nombre!);
  }

  eliminarDocumento(index: number) {
    const doc = this.documentos[index];
    if (!doc.nuxeo_enlace) {
      this.documentos.splice(index, 1);
      return;
    }
    this.alertService.showConfirmAlert('¿Está seguro de eliminar este documento?', 'Eliminar documento').then((resp) => {
      if (!resp.isConfirmed) return;
      this.planAuditoriaCrud.put(`documento/${doc._id}`, { ...doc, activo: false }).subscribe({
        next: (res: any) => {
          if (res?.Success) {
            this.documentos = this.documentos.filter(d => d !== doc);
            this.alertService.showSuccessAlert('Documento eliminado con éxito.');
          }
        },
        error: () => this.alertService.showErrorAlert('No se pudo eliminar el documento.'),
      });
    });
  }

  // ─── Calificación (auditor asignado) ────────────────────────────────────────

  guardarCalificacion({ calificacion, criterio, observaciones }: ValoresCalificacion) {
    const criterioNombre = criterioPorId(criterio)?.nombre ?? '';
    this.alertService.showConfirmAlert(
      `Calificación: ${calificacion}% · ${criterioNombre}. Para corregirla después deberá emitir una nueva calificación.`,
      '¿Está seguro de calificar la acción?'
    ).then(res => {
      if (!res.isConfirmed) return;
      const nuevaCalificacion: Calificacion = {
        accion_mejora_id: this.accionId,
        auditor_id: this.usuarioId,
        calificacion,
        criterio_evaluacion: criterio,
        observacion: observaciones,
        fecha_calificacion: new Date(),
        actual: true,
      };
      this.guardandoCalificacion = true;
      const anterior = this.calificacionActual;
      // Primero se crea la nueva y luego se desmarca la anterior: si algo falla, la acción nunca queda sin calificación vigente
      // (la vigente es la más reciente con actual:true, así que dos marcadas no confunden la vista).
      (this.planAuditoriaCrud.post('calificacion-accion', nuevaCalificacion) as Observable<any>).pipe(
        switchMap((res: any) => {
          const desmarcar$: Observable<unknown> = anterior?._id
            ? this.planAuditoriaCrud.put(`calificacion-accion/${anterior._id}`, { ...anterior, actual: false }).pipe(
                catchError((err) => {
                  console.error('No se pudo desmarcar la calificación anterior', err);
                  return of(null);
                }),
              )
            : of(null);
          return desmarcar$.pipe(map(() => res));
        }),
        catchError((err) => {
          console.error(err);
          this.guardandoCalificacion = false;
          this.alertService.showErrorAlert('No se pudo registrar la calificación.');
          return EMPTY;
        }),
      ).subscribe((res: any) => {
        const guardada: Calificacion = { ...res?.Data, fecha_calificacion: new Date(res?.Data?.fecha_calificacion) };
        this.calificaciones = [guardada, ...this.calificaciones.map(c => ({ ...c, actual: false }))];
        this.calificacionActual = guardada;
        this.guardandoCalificacion = false;
        this.editandoCalificacion = false;
        this.alertService.showSuccessAlert('La calificación ha sido registrada.');
      });
    });
  }

  // ─── Paneles laterales ──────────────────────────────────────────────────────

  abrirFicha(pestana: PestanaFicha = 'accion') {
    const datos: DatosFichaAccion = {
      pestana,
      accion: {
        noAccion: this.accion?.no_accion,
        tipo: this.tipoAccionNombre,
        descripcion: this.accion?.descripcion,
        nombreIndicador: this.accion?.nombre_indicador,
        formulaIndicador: this.accion?.formula_indicador,
        meta: this.accion?.meta,
        fechaInicio: this.accion?.fecha_inicio,
        fechaFin: this.accion?.fecha_fin,
      },
      hallazgo: {
        numero: this.hallazgo?.no_hallazgo,
        descripcion: this.hallazgo?.descripcion,
        causa: this.hallazgo?.criterio,
      },
      auditoria: {
        numero: this.auditoria?.consecutivo_no_auditoria,
        nombre: this.nombreAuditoria,
        tipoEvaluacion: this.auditoria?.tipo_evaluacion_nombre,
        vigencia: this.auditoria?.vigencia_nombre,
      },
      dependenciasLideres: this.dependenciasLideres,
      dependenciasApoyo: this.dependenciasApoyo,
      // plan-mejoramiento-auditor puede traer al mismo auditor repetido
      auditores: this.auditores.filter((a, i, lista) => lista.findIndex(b => b.auditor_id === a.auditor_id) === i),
    };
    this.dialog.open(PanelFichaAccionComponent, { ...CONFIG_PANEL_LATERAL, ariaLabelledBy: 'tituloPanelFicha', data: datos });
  }

  abrirHistorial() {
    const calificaciones: CalificacionHistorial[] = this.calificaciones.map(c => ({
      porcentaje: c.calificacion,
      criterio: criterioPorId(c.criterio_evaluacion),
      observacion: c.observacion,
      fecha: c.fecha_calificacion,
      auditor: this.nombreAuditor(c.auditor_id),
      vigente: c.actual,
    }));
    this.dialog.open(PanelHistorialCalificacionesComponent, { ...CONFIG_PANEL_LATERAL, ariaLabelledBy: 'tituloPanelHistorial', data: { calificaciones } });
  }

  abrirForo() {
    this.dialog.open(PanelForoAccionComponent, {
      ...CONFIG_PANEL_LATERAL,
      ariaLabelledBy: 'tituloPanelForo',
      data: { esAuditor: this.esAuditorAsignado() },
    });
  }

  regresar() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
}
