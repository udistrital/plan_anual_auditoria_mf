import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatStepper } from "@angular/material/stepper";
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router, ActivatedRoute } from "@angular/router";
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { formularioInformacionAuditoria } from "./editar-auditoria.utilidades";
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AlertService } from "src/app/shared/services/alert.service";
import { ParametrosService } from 'src/app/core/services/parametros.service';
import { OikosService } from 'src/app/core/services/oikos.service';
import { HallazgoResumen } from './hallazgos-auditoria/hallazgos-auditoria.component';
import { environment } from 'src/environments/environment';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { CargarArchivoComponent } from 'src/app/shared/elements/components/cargar-archivo/cargar-archivo.component';
import { ModalVisualizarRecargarInformeAuditoriaComponent } from './modal-visualizar-recargar-informe-auditoria/modal-visualizar-recargar-informe-auditoria.component';

@Component({
  selector: 'app-editar-auditoria',
  templateUrl: './editar-auditoria.component.html',
  styleUrls: ['./editar-auditoria.component.css']
})
export class EditarAuditoriaComponent implements OnInit, AfterViewInit {
  @ViewChild("stepper") stepper!: MatStepper;

  @ViewChild("formularioInformacionComp")
  formularioInformacionComponent!: FormularioDinamicoComponent;

  formInformacion: Formulario | undefined;
  auditoriaId!: string;
  auditoriaData: any = null;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";
  hallazgos: HallazgoResumen[] = [];
  base64InformeAuditoria: any = null;

  constructor(
    private readonly alertaService: AlertService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly parametrosService: ParametrosService,
    private readonly oikosService: OikosService,
    private readonly dialog: MatDialog,
    private readonly nuxeoService: NuxeoService,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
  ) { }

  async ngOnInit() {
    this.formInformacion = formularioInformacionAuditoria;
    this.manejarResponsiveStepper();
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.cargarDependencias();
    this.cargarAuditoria();
  }

  cargarDependencias(): void {
    this.oikosService
      .get(`dependencia?query=Activo:true&limit=0&sortby=Nombre&order=asc&fields=Id,Nombre`)
      .pipe(catchError(() => of([])))
      .subscribe((res: any) => {
        const opciones = (Array.isArray(res) ? res : []).filter((d: any) => d.Nombre?.length > 0);
        const campo = this.obtenerCampoFormulario('dependencia');
        if (campo) campo.parametros!.opciones = opciones;
      });
  }

  ngAfterViewInit() { }

  private readonly selectActions: Record<string, (valor: any) => void> = {
    macroproceso: (valor) => this.manejarCambioMacroproceso(valor),
    dependencia: (valor) => this.manejarCambioDependencia(valor),
  };

  manejarCambioSelect(event: { campo: any; valor: any }): void {
    this.selectActions[event.campo.nombre]?.(event.valor);
  }

  manejarCambioMacroproceso(macroprocesoId: any): void {
    const campoProceso = this.obtenerCampoFormulario('proceso');
    if (campoProceso) campoProceso.parametros!.opciones = [];
    this.formularioInformacionComponent?.form.patchValue({ proceso: null });

    if (!macroprocesoId) {
      if (campoProceso) campoProceso.deshabilitado = true;
      this.formularioInformacionComponent?.form.get('proceso')?.disable();
      return;
    }

    if (campoProceso) campoProceso.deshabilitado = false;
    this.formularioInformacionComponent?.form.get('proceso')?.enable();

    const { PROCESO } = environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${PROCESO.TIPO_PARAMETRO_ID},ParametroPadreId:${macroprocesoId}&fields=Id,Nombre&limit=0&sortby=Nombre&order=asc`)
      .subscribe((res: any) => {
        const campo = this.obtenerCampoFormulario('proceso');
        if (campo) campo.parametros!.opciones = res?.Data ?? [];
      });
  }

  manejarCambioDependencia(dependenciaId: any): void {
    if (!dependenciaId) return;
    this.cargarPersonasDependencia(dependenciaId);
  }

  cargarPersonasDependencia(dependenciaId: number): void {
    console.log("cargarPersonasDependencia", dependenciaId);
  }

  obtenerCampoFormulario(nombreCampo: string) {
    return this.formInformacion?.campos?.find((c) => c.nombre === nombreCampo);
  }

  manejarResponsiveStepper() {
    this.breakpointObserver
      .observe(["(max-width: 992px)"])
      .subscribe((result) => {
        this.orientation = result.matches ? "vertical" : "horizontal";
      });
  }

  regresarRuta() {
    this.router.navigate([`/auditorias-externas`]);
  }

  cargarAuditoria(): void {
    console.log("Cargar auditoria externa: ", this.auditoriaId);
  }

  poblarFormularioInformacion(): void {
    if (!this.auditoriaData || !this.formularioInformacionComponent) return;
    const d = this.auditoriaData;

    if (d.macroproceso_id) {
      this.formularioInformacionComponent.form.patchValue({ macroproceso: d.macroproceso_id });
      this.manejarCambioMacroproceso(d.macroproceso_id);
    }

    this.formularioInformacionComponent.form.patchValue({
      proceso: d.proceso_id ?? null,
      dependencia: d.dependencia_id ?? null,
      jefe_nombre: d.jefe_nombre,
      asistente_nombre: d.asistente_nombre,
      correo_dependencia: d.correo_dependencia,
      jefe_correo: d.jefe_correo,
      asistente_correo: d.asistente_correo,
      correo_complementario: d.correo_complementario,
    });
  }

  enviarFormInformacion() {
    this.formularioInformacionComponent.onSubmit();
  }

  preguntarGuardadoInformacion(dataForm: any) {
    if (!dataForm) {
      return this.alertaService.showAlert("Formulario incompleto", "Debe llenar todos los campos obligatorios");
    }
    this.alertaService.showConfirmAlert("¿Está seguro(a) de guardar la información?").then((confirmado) => {
      if (!confirmado.value) return;
      console.log("Payload para guardar:", dataForm);
      this.stepper.next();
    });
  }

  onHallazgosActualizados(hallazgos: HallazgoResumen[]): void {
    this.hallazgos = hallazgos;
  }

  guardarYCerrar() {
    this.alertaService.showConfirmAlert("¿Está seguro(a) de guardar la auditoría?").then((confirmado) => {
      if (!confirmado.value) return;
      this.alertaService.showSuccessAlert("Su auditoría fue guardada exitosamente", "Auditoría Guardada");
    });
  }

  buscarInformeAuditoria() {
    console.log("buscarInformeAuditoria", this.auditoriaId);
  }

  subirInformeAuditoria(): void {
    this.dialog.open(CargarArchivoComponent, {
      width: '800px',
      data: {
        tipoArchivo: 'pdf',
        id: this.auditoriaId,
        idTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        descripcion: 'Informe auditoria',
        cargaLambda: false,
        tipoIdReferencia: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO,
        referencia: 'Auditoria',
      },
    });
  }

  verInformeAuditoria(): void {
    this.dialog.open(ModalVisualizarRecargarInformeAuditoriaComponent, {
      data: { base64Document: this.base64InformeAuditoria, id: this.auditoriaId },
      width: '80%',
      height: '80vh',
    });
  }
}
