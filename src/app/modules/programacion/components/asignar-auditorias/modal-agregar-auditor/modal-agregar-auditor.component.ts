import { AutenticacionMidService } from './../../../../../core/services/autenticacion-mid.service';
import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ParametrosService } from 'src/app/core/services/parametros.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { UserService } from 'src/app/core/services/user.service';
import { Parametro } from 'src/app/shared/data/models/parametros/parametros';
import { Auditoria } from 'src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ModalService } from 'src/app/shared/services/modal.service';

interface Auditor {
  nombre: string;
  documento: number;
  id: number;
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
  auditoresSeleccionados: FormArray<FormGroup>;
  meses: Parametro[] = [];
  TODOS = "Todos";
  isEditMode = false;
  usuarioId: any;  

  constructor(
    private alertaService: AlertService,
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    public dialogRef: MatDialogRef<ModalAgregarAuditorComponent>,
    private modalService: ModalService,
    private AutenticacionMidService: AutenticacionMidService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: { auditoria?: Auditoria }
  ) {
    this.auditoresSeleccionados =this.fb.array<FormGroup>([]);
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria;
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
      console.log("usuario Logeado", this.usuarioId, usuarioId);
      });
    this.form = this.fb.group({
      tituloAuditoria: [this.data.auditoria?.auditoria || ""],
      tipoEvaluacion: [this.data.auditoria?.tipoEvaluacion || []],
      cronogramaActividades: [this.data.auditoria?.cronograma || []],
      auditoresSeleccionados: this.auditoresSeleccionados,
      auditor: [""],
    });
    this.CargarEvaluaciones();
    this.cargarMeses();
    this.cargarAuditores();      
  }

  inicializarAuditoresSeleccionados(): void {
    const auditoresAsignados = this.data.auditoria?.auditores || [];
    console.log("auditoresAsignados", auditoresAsignados);
  
    auditoresAsignados.forEach((auditorAsignado: any) => {
      console.log("auditorSelector", auditorAsignado);  
      
      const auditorEncontrado = this.auditores.find((a) => a.id === auditorAsignado.auditor_id);
      console.log("a.id", this.auditores );
  
      if (auditorEncontrado) {
        const auditorControl = this.fb.group({
          auditor: this.fb.control<Auditor | null>(auditorEncontrado),
          lider: this.fb.control<boolean>(auditorAsignado.auditor_lider || false),
        });
  
        
        this.auditoresSeleccionados.push(auditorControl);
  
        console.log("Auditor encontrado:", auditorEncontrado);
        console.log("Control de auditor:", auditorControl);
      } else {
        console.warn(`Auditor con ID ${auditorAsignado.id} no encontrado en la lista de auditores.`);
      }
    });
  }

  agregarAuditor() {
    this.auditoresSeleccionados.push(
      this.fb.group({
        auditor: this.fb.control<Auditor | null>(null),
        lider: this.fb.control<boolean>(false),
      })
      );
  }

  eliminarAuditor(index: number) {
    const auditorSeleccionado = this.auditoresSeleccionados.at(index)?.value;
  
    console.log("Auditor seleccionado para eliminar:", auditorSeleccionado);
  
    if (auditorSeleccionado && auditorSeleccionado.auditor) {
      
      this.alertaService.showConfirmAlert(`¿Está seguro de eliminar este auditor?`).then((result) => {
        if (result.isConfirmed) {
          
          this.planAnualAuditoriaService.get("auditor").subscribe({
            next: (response: any) => {
              console.log("Respuesta auditor", response);
  
              if (response && response.Data) {                
                console.log("auditorSeleccionado.auditor.id", auditorSeleccionado.auditor.id);
                console.log("this.data.auditoria?.id", this.data.auditoria?.id);
                
                const auditorAsignado = response.Data.find(
                  (item: any) =>
                    item.auditoria_id === this.data.auditoria?.id && 
                    item.auditor_id === auditorSeleccionado.auditor.id
                );
  
                if (auditorAsignado) {
                  console.log("auditorAsignadopara eliminar", auditorAsignado);
                  console.log("auditorAsignadopara eliminar", auditorAsignado._id);
                  const auditorId = auditorAsignado._id;
                  console.log("auditorId", auditorId);
                  
                  this.planAnualAuditoriaService.delete("auditor", auditorId).subscribe({
                    next: (deleteResponse: any) => {
                      console.log("Auditor eliminado exitosamente", deleteResponse);
                      // Eliminar del array local
                      this.auditoresSeleccionados.removeAt(index);
                      this.alertaService.showSuccessAlert("Auditor eliminado correctamente.");
                    },
                    error: (err) => {
                      console.error("Error al eliminar auditor", err);
                      this.alertaService.showErrorAlert("Error al eliminar el auditor. Inténtelo de nuevo.");
                    },
                  });
                } else {
                  console.warn("No se encontró el registro del auditor en el backend.");
                  this.alertaService.showErrorAlert("No se encontró el registro del auditor.");
                }
              }
            },
            error: (err) => {
              console.error("Error al obtener los auditores", err);
              this.alertaService.showErrorAlert("Error al obtener los auditores. Inténtelo de nuevo.");
            },
          });
        }
      });
    } else {
      console.warn("No se encontró el ID del auditor para eliminar.");
      
      this.auditoresSeleccionados.removeAt(index);
    }
  }

  cargarAuditores() {
    this.AutenticacionMidService.get("rol/periods").subscribe((res) => {
      console.log("res", res);
      if (res && res.Data) {
        this.auditores = res.Data
        .filter((auditor: any) => auditor.finalizado === false &&
        ["AUDITOR", "AUDITOR_EXPERTO"].includes(auditor.rol_usuario))  
        .map((auditor: any) => ({
          nombre: auditor.nombre,
          documento: auditor.documento,
          id: auditor.id_tercero
      }));        
      }
      this. inicializarAuditoresSeleccionados();
      console.log("Auditores", this.auditores);
      console.log("auditoria id", this.data.auditoria!.id);
    });
  }

  auditoresDisponibles(index: number): Auditor[] {
    const seleccionados = this.auditoresSeleccionados.value
      .filter((_, i) => i !== index)
      .map((control: {auditor: Auditor }) => control.auditor?.documento);

    return this.auditores.filter((auditor) => !seleccionados.includes(auditor.documento));
  }

  onLiderChange(selectedIndex: number): void {
    this.auditoresSeleccionados.controls.forEach((control, index) => {
      if (index !== selectedIndex) {
        control.get('lider')?.setValue(false);
      }
    });
  }

  asignarAuditor(auditorSeleccionado: any): void {
    const auditorPayload = {
      auditoria_id: this.data.auditoria?.id,
      auditor_id: auditorSeleccionado.id,
      asignado: true,
      asignado_por_id: this.usuarioId,
      auditor_lider: auditorSeleccionado.lider
    };
  
    console.log("auditorPayload", auditorPayload);
  
    
    this.planAnualAuditoriaService.get("auditor").subscribe({
      next: (response: any) => {
        console.log("Respuesta auditorAsignado", response);
  
        if (response && response.Data) {
          // Filtrar los datos en el cliente
          const auditorAsignado = response.Data.find(
            (item: any) =>
              item.auditoria_id === auditorPayload.auditoria_id &&
              item.auditor_id === auditorPayload.auditor_id
          );
  
          console.log("auditorAsignado", auditorAsignado);
  
          if (auditorAsignado) {
            
            this.planAnualAuditoriaService
              .put(`auditor/${auditorAsignado._id}`, auditorPayload)
              .subscribe({
                next: (updateResponse: any) => {
                  console.log("Auditor actualizado exitosamente", updateResponse);
                },
                error: (err) => {
                  console.error("Error al actualizar auditor", err);
                },
              });
          } else {
            
            this.planAnualAuditoriaService
              .post("auditor", auditorPayload)
              .subscribe({
                next: (createResponse: any) => {
                  console.log("Auditor asignado exitosamente", createResponse);
                },
                error: (err) => {
                  console.error("Error al asignar auditor", err);
                },
              });
          }
        } else {
          console.error("No se encontraron datos en la respuesta del servidor");
        }
      },
      error: (err) => {
        console.error("Error al verificar auditor asignado", err);
      },
    });
  }

  cargarMeses() {
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

  guardarAuditoria() {
    if (this.form.valid) {
      this.alertaService
        .showConfirmAlert(`¿Está seguro(a) de actualizar la auditoría?`)
        .then((result) => {
          if (result.isConfirmed) {
            console.log("auditoria id", this.data.auditoria!.id);

            const auditoresSeleccionados = this.auditoresSeleccionados.value.map(
              (item: {auditor: Auditor | null; lider: boolean}) =>  ({
                documento: item.auditor?.documento || 0,
                lider: item.lider,
                id: item.auditor?.id
              })
            );
            console.log("AuditoresSelecc", auditoresSeleccionados);

            auditoresSeleccionados.forEach((auditor) => {
              if (auditor.documento){
                console.log("auditor", auditor);
                this.asignarAuditor(auditor);
              }
            });
            const formData = {
              titulo: this.form.value.tituloAuditoria,
              tipo_evaluacion_id: this.form.value.tipoEvaluacion,
              cronograma_id: this.form.value.cronogramaActividades,
              //auditores: auditoresSeleccionados
              
            };

            console.log("formData", formData);

            this.planAnualAuditoriaService
              .put(`auditoria/${this.data.auditoria!.id}`, formData)
              .subscribe({
                next: (response: any) => {
                  if (response.Status === 200) {
                    this.alertaService.showSuccessAlert(
                      `Auditoría actualizada exitosamente.`
                    );
                    this.dialogRef.close({ saved: true });
                  } else {
                    this.alertaService.showSuccessAlert(
                      `Error al actualizar la auditoría. Código de estado inesperado: ${response.Status}`
                    );
                  }
                },
                error: (err) => {
                  this.alertaService.showErrorAlert(
                    `Error al actualizar la auditoría. Inténtelo de nuevo.`
                  );
                },
              });
          }
        });
    } else {
      console.log("Formulario no valido");
      this.form.markAllAsTouched();
    }
  }
}
