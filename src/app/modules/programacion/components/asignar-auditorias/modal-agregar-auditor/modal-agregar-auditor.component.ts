import { AutenticacionMidService } from './../../../../../core/services/autenticacion-mid.service';
import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ParametrosService } from 'src/app/core/services/parametros.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { Parametro } from 'src/app/shared/data/models/parametros/parametros';
import { Auditoria } from 'src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ModalService } from 'src/app/shared/services/modal.service';

interface Auditor {
  nombre: string;
  documento: number;
}

@Component({
  selector: 'app-modal-agregar-auditor',
  templateUrl: './modal-agregar-auditor.component.html',
  styleUrl: './modal-agregar-auditor.component.css'
})
export class ModalAgregarAuditorComponent implements OnInit {

  form: FormGroup | any;
  evaluaciones: Parametro[] = [];
  auditores: Auditor[] = [];
  auditoresSeleccionados: FormArray<FormControl<string | null>>;
  meses: Parametro[] = [];
  TODOS = "Todos";
  isEditMode = false;

  constructor(
    private alertaService: AlertService,
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    public dialogRef: MatDialogRef<ModalAgregarAuditorComponent>,
    private modalService: ModalService,
    private AutenticacionMidService: AutenticacionMidService,
    @Inject(MAT_DIALOG_DATA) public data: { auditoria?: Auditoria }
  ) {
    this.auditoresSeleccionados =this.fb.array<FormControl<string | null>>([]);
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria;
    this.form = this.fb.group({
      tituloAuditoria: [this.data.auditoria?.auditoria || ""],
      tipoEvaluacion: [this.data.auditoria?.tipoEvaluacion || []],
      cronogramaActividades: [this.data.auditoria?.cronograma || []],
      auditoresSeleccionados: this.auditoresSeleccionados,
      auditor: [""],
    });
    this.CargarEvaluaciones();
    this.CargarMeses();
    this.CargarAuditores();      
  }

  agregarAuditor() {
    this.auditoresSeleccionados.push(this.fb.control<string | null>(""));
  }

  eliminarAuditor(index: number) {
    this.auditoresSeleccionados.removeAt(index);
  }

  CargarAuditores() {
    this.AutenticacionMidService.get("rol/periods").subscribe((res) => {
      console.log("res", res);
      if (res && res.Data) {
        this.auditores = res.Data
        .filter((auditor: any) => auditor.finalizado === false &&
        ["AUDITOR", "AUDITOR_EXPERTO"].includes(auditor.rol_usuario))  
        .map((auditor: any) => ({
          nombre: auditor.nombre,
          documento: auditor.documento
      }));        
      }
      console.log("Auditores", this.auditores);
    });
  }
  CargarMeses() {
    this.parametrosService
      .get("parametro?query=TipoParametroId:139&limit=0")
      .subscribe((res) => {
        if (res !== null) {
          this.meses = res.Data;
        }
      });
  }

  CargarEvaluaciones() {
    this.parametrosService
      .get("parametro?query=TipoParametroId:136&limit=0")
      .subscribe((res) => {
        if (res !== null) {
          this.evaluaciones = res.Data;
        }
      });
  }

  onSave() {
  }
}
