import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Formulario } from 'src/app/data/models/formulario.model';
import { formularioPAA1 } from 'src/app/data/forms/formulario-PAA';
import { formularioPAA2 } from 'src/app/data/forms/formulario-PAA-valores';
import { FormularioDinamicoComponent } from 'src/app/components/formulario-dinamico/formulario-dinamico.component';
import { ModalService } from 'src/app/services/modal.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-registrar-plan',
  templateUrl: './registrar-plan.component.html',
  styleUrl: './registrar-plan.component.css'
})
export class RegistrarPlanComponent implements OnInit {
  @ViewChild(FormularioDinamicoComponent) formularioDinamico!: FormularioDinamicoComponent;

  planId: string = '';
  formulario: Formulario | null = null;
  parametros: Record<string, any> = {}; 

  constructor(
    private route: ActivatedRoute,
    private modalService: ModalService,
    private parametrosService: ParametrosService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async params => {
      this.planId = params['id'];
      await this.obtenerParametros(); 
      this.loadFormulario(); 
    });
  }

  // Función asíncrona para obtener valores de parámetros
  async obtenerParametros(): Promise<void> {
    const camposIds = Object.values(environment.idsCamposFormulario);

    const requests = camposIds.map(async (campoId) => {
      try {
        const res = await this.parametrosService.get(`parametro/${campoId}`).toPromise();
        if (res && res.Data) {
          this.parametros[campoId] = res.Data.Descripcion;
        }
      } catch (error) {
        console.error(`Error cargando valor para el campo con id ${campoId}`, error);
      }
    });

    await Promise.all(requests); 
  }

  // Selecciona y modifica el formulario según los parámetros obtenidos
  loadFormulario(): void {
    if (this.planId === '1') {
      this.formulario = formularioPAA1;
    } else if (this.planId === '2') {
      this.formulario = formularioPAA2;
    } else {
      console.error('No se encontró un formulario para el planId:', this.planId);
      return;
    }

    this.cargarValoresFormulario();
  }

  // Asigna valores a cada campo del formulario usando los parámetros obtenidos
  cargarValoresFormulario(): void {
    if (this.formulario && this.formulario.campos) {
      this.formulario.campos.forEach((campo) => {
        const campoId = environment.idsCamposFormulario[campo.nombre as keyof typeof environment.idsCamposFormulario];
        if (campoId && this.parametros[campoId]) {
          campo.valor = this.parametros[campoId]; 
        } else {
          console.warn(`No se encontró un id o valor para el campo ${campo.nombre}`);
        }
      });
      this.cdr.detectChanges(); 
    } else {
      console.error("El formulario o sus campos no están definidos");
    }
  }

  errorRegistro() {
    this.modalService.mostrarModal(
      'Información no guardada por favor intente nuevamente',
      'error',
      'ERROR'
    );
  }

  guardarInformacion() {
    this.modalService
      .modalConfirmacion(
        ' ',
        'warning',
        '¿Está seguro(a) de guardar la información?'
      )
      .then((result) => {
        if (result.isConfirmed) {
          this.formularioDinamico.submitFormulario.subscribe((formData: any) => {
            this.manejarEnvio(formData);
          });
          this.enviarFormulario();
        }
      });
  }

  enviarFormulario(): void {
    if (this.formularioDinamico) {
      this.formularioDinamico.onSubmit();
    }
  }

  manejarEnvio(formData: any): void {
    if (formData) {
      console.log('Formulario enviado correctamente:', formData);
      this.modalService.mostrarModal(
        'La información fue guardada exitosamente',
        'success',
        'INFORMACIÓN GUARDADA'
      );
    } else {
      this.errorRegistro();
    }
  }
}
