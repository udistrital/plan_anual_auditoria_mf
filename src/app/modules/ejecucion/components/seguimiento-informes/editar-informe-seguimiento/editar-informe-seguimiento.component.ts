import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatStepper } from "@angular/material/stepper";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router, ActivatedRoute } from "@angular/router";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { formularioDependencias, formularioInformacionSeguimiento } from "./editar-informe-seguimiento.utilidades";
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AspectosEvaluadosSeguimientoComponent } from './aspectos-evaluados-seguimiento/aspectos-evaluados-seguimiento.component';
import { AlertService } from "src/app/shared/services/alert.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalVerDocumentosComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { Auditoria } from 'src/app/shared/data/models/auditoria';

@Component({
  selector: 'app-editar-informe-seguimiento',
  templateUrl: './editar-informe-seguimiento.component.html',
  styleUrls: ['./editar-informe-seguimiento.component.css']
})
export class EditarInformeSeguimientoComponent implements OnInit {
  @ViewChild("stepper") stepper!: MatStepper;

  @ViewChild("formularioInformacionComp")
  formularioInformacionComponent!: FormularioDinamicoComponent;

  @ViewChild(AspectosEvaluadosSeguimientoComponent)
  aspectosEvaluadosComp!: AspectosEvaluadosSeguimientoComponent;
  formularioInformacion: Formulario | undefined;

  @ViewChildren("formularioDependenciasComp")
  formularioDependenciasComponent!: QueryList<FormularioDinamicoComponent>;
  formularioDependencias: Formulario = formularioDependencias;

  formAspectosGenerales: FormGroup;
  formObservacionesConclusiones: FormGroup;

  informeId!: string;
  informeData: any = null;
  auditoria: Auditoria | null = null;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";

  constructor(
    private readonly alertaService: AlertService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly dialog: MatDialog,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly changeDetector: ChangeDetectorRef
  ) {
    this.formAspectosGenerales = this.fb.group({
      aspecto_general: [''],
    });
    this.formObservacionesConclusiones = this.fb.group({
      observacion_conclusion: [''],
      nota: [''],
    });
  }

  ngOnInit() {
    this.cargarFormularios();
    this.manejarResponsiveStepper();
    this.informeId = this.route.snapshot.paramMap.get("id")!;
    this.cargarInforme();
  }

  cargarFormularios(): void {
    this.formularioInformacion = formularioInformacionSeguimiento;
    this.formularioDependencias = formularioDependencias;
  }

  manejarResponsiveStepper() {
    this.breakpointObserver
      .observe(["(max-width: 992px)"])
      .subscribe((result) => {
        this.orientation = result.matches ? "vertical" : "horizontal";
      });
  }

  regresarRuta() {
    this.router.navigate([`/ejecucion/seguimiento-informes`]);
  }

  // Carga el informe y la auditoría enriquecida (MID) para poblar todos los campos
  cargarInforme(): void {
    this.planAnualAuditoriaService.get(`informe/${this.informeId}`).subscribe({
      next: (response: any) => {
        if (response && response.Data) {
          this.informeData = response.Data;
          this.poblarFormularios();
          this.cargarAuditoriaParaFormulario();
        }
      },
      error: (error) => {
        console.error('Error al cargar el informe:', error);
      }
    });
  }

  // Carga la auditoría desde el MID para obtener campos enriquecidos (macroproceso, dependencia, correos, etc.)
  cargarAuditoriaParaFormulario(): void {
    const auditoriaId = this.informeData?.auditoria_id;
    if (!auditoriaId) return;
    this.planAuditoriaMid.get(`auditoria/${auditoriaId}`).subscribe({
      next: (res: any) => {
        this.poblarFormularioInformacion(res.Data);
      },
      error: (error) => {
        console.error('Error al cargar la auditoría:', error);
        this.poblarFormularioInformacion();
      }
    });
  }

  // Pobla los formularios con los datos del informe cargado
  poblarFormularios(): void {
    if (!this.informeData) return;

    // Poblar formulario de aspectos generales (paso 2)
    this.formAspectosGenerales.patchValue({
      aspecto_general: this.informeData.aspecto_general,
    });

    // Poblar formulario de observaciones y conclusiones (último paso)
    this.formObservacionesConclusiones.patchValue({
      observacion_conclusion: this.informeData.observacion_conclusion,
      nota: this.informeData.nota,
    });
  }

  // Pobla el formulario de información con datos del informe y de la auditoría enriquecida
  poblarFormularioInformacion(auditoria?: Auditoria): void {
    if (!this.formularioInformacionComponent) return;
    this.auditoria = auditoria ?? null;
    this.changeDetector.detectChanges();

    const valoresIniciales: any = {
      no_auditoria: auditoria?.consecutivo_no_auditoria,
      macroproceso: auditoria?.macroproceso_nombre,
      proceso: auditoria?.proceso_nombre,
      objetivo_auditoria: auditoria?.objetivo,
      alcance_auditoria: auditoria?.alcance,
      criterios: auditoria?.criterio,
    };

    if (this.informeData?.fecha_emision) {
      valoresIniciales.fecha_emision_informe = new Date(this.informeData.fecha_emision);
    }
    if (this.informeData?.muestra) {
      valoresIniciales.muestra = this.informeData.muestra;
    }

    this.formularioInformacionComponent.form.patchValue(valoresIniciales);

    this.formularioDependenciasComponent.forEach((comp, i) => {
      const dep = this.auditoria?.datos_dependencias[i];
      const correo = this.auditoria?.correo_complementario?.find((c: any) => c.dependencia_id === dep?.dependencia_id)?.correo ?? '';
      comp.form.patchValue({
        dependencia_id: dep?.dependencia_id,
        jefe_nombre: dep?.jefe_nombre,
        jefe_correo: dep?.jefe_correo,
        asistente_nombre: dep?.asistente_nombre,
        asistente_correo: dep?.asistente_correo,
        correo_dependencia: dep?.correo_dependencia,
        correo_complementario: correo,
      });
    });
  }

  enviarFormInformacion() {
    this.formularioInformacionComponent.onSubmit();
  }

  preguntarGuardadoInformacion(dataForm: any) {
    if (!dataForm) {
      return this.alertaService.showAlert("Formulario incompleto", "Debe llenar todos los campos obligatorios");
    }

    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de guardar la información?")
      .then((confirmado) => {
        if (!confirmado.value) return;
        this.guardarInformacion(dataForm);
      });
  }

  guardarInformacion(informacion: any) {
    const campos = {
      fecha_emision: informacion.fecha_emision_informe,
      muestra: informacion.muestra ?? null,
    };
    this.guardarPaso(campos, "La información se ha guardado correctamente", "No se pudo guardar la información");
  }

  private guardarPaso(camposActualizados: any, mensajeExito: string, mensajeError: string): void {
    const payload = { ...this.informeData, ...camposActualizados };

    this.planAnualAuditoriaService.put(`informe/${this.informeId}`, payload).subscribe({
      next: () => {
        this.alertaService.showAlert("Guardado exitoso", mensajeExito);
        this.informeData = { ...this.informeData, ...camposActualizados };
        this.stepper.next();
      },
      error: (error) => {
        console.error('Error al guardar:', error);
        this.alertaService.showAlert("Error", mensajeError);
      }
    });
  }

  guardarAspectosGenerales() {
    this.guardarPaso(this.formAspectosGenerales.value, "Los aspectos generales se han guardado correctamente", "No se pudieron guardar los aspectos generales");
  }

  // Guarda los aspectos evaluados (temas y subtemas) y avanza al siguiente paso
  async guardarAspectosEvaluados(): Promise<void> {
    const ok = await this.aspectosEvaluadosComp.guardarAspectos();
    if (ok) this.stepper.next();
  }

  guardarObservacionesConclusiones() {
    this.guardarPaso(this.formObservacionesConclusiones.value, "Las observaciones se han guardado correctamente", "No se pudieron guardar las observaciones");
  }

  verInforme() {
    this.dialog.open(ModalVerDocumentosComponent, {
      width: "1200px",
      data: {
        entityId: this.informeId,
        titulo: "Ver Documentos",
        descripcion: "Documentos del Seguimiento",
        tabs: [
          { nombre: "Informe Final", tipoId: 0 },
          { nombre: "Oficio Anuncio Solicitud Información", tipoId: 0 },
        ],
        textoBotonCerrar: "Guardar y Cerrar"
      },
    });
  }
}
