import { Component, OnInit, ViewChild } from '@angular/core';
import { MatStepper } from "@angular/material/stepper";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router, ActivatedRoute } from "@angular/router";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { formularioInformacionAuditoria } from "./editar-auditoria.utilidades";
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { HallazgoResumen } from './hallazgos-auditoria/hallazgos-auditoria.component';

@Component({
  selector: 'app-editar-auditoria',
  templateUrl: './editar-auditoria.component.html',
  styleUrls: ['./editar-auditoria.component.css']
})
export class EditarAuditoriaComponent implements OnInit {
  @ViewChild("stepper") stepper!: MatStepper;

  @ViewChild("formularioInformacionComp")
  formularioInformacionComponent!: FormularioDinamicoComponent;

  formInformacion: Formulario | undefined;
  auditoriaId!: string;
  auditoriaData: any = null;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";
  hallazgos: HallazgoResumen[] = [];

  constructor(
    private alertaService: AlertService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private route: ActivatedRoute,
    private planAnualAuditoriaService: PlanAnualAuditoriaService
  ) {}

  ngOnInit() {
    this.formInformacion = formularioInformacionAuditoria;
    this.manejarResponsiveStepper();
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.cargarAuditoria();
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
    this.planAnualAuditoriaService.get(`auditoria/${this.auditoriaId}`).subscribe({
      next: (response: any) => {
        if (response?.Data) {
          this.auditoriaData = response.Data;
          this.poblarFormularioInformacion();
        }
      },
      error: (error) => {
        console.error('Error al cargar la auditoría:', error);
      }
    });
  }

  poblarFormularioInformacion(): void {
    if (!this.auditoriaData || !this.formularioInformacionComponent) return;
    const valores: any = {};
    if (this.auditoriaData.fecha_emision) valores.fecha_emision = new Date(this.auditoriaData.fecha_emision);
    if (this.auditoriaData.muestra) valores.Muestra = this.auditoriaData.muestra;
    this.formularioInformacionComponent.form.patchValue(valores);
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
      const campos = { fecha_emision: dataForm.fecha_emision, muestra: dataForm.Muestra || null };
      const payload = { ...this.auditoriaData, ...campos };
      this.planAnualAuditoriaService.put(`auditoria/${this.auditoriaId}`, payload).subscribe({
        next: () => {
          this.alertaService.showAlert("Guardado exitoso", "La información se ha guardado correctamente");
          this.auditoriaData = { ...this.auditoriaData, ...campos };
          this.stepper.next();
        },
        error: () => {
          this.alertaService.showAlert("Error", "No se pudo guardar la información");
        }
      });
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
}
