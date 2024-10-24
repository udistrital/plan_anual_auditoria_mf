import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Formulario } from 'src/app/data/models/formulario.model';
import { formularioPAA1 } from 'src/app/data/forms/formulario-PAA';
import { formularioPAA2 } from 'src/app/data/forms/formulario-PAA-valores';
import { FormularioDinamicoComponent } from 'src/app/components/formulario-dinamico/formulario-dinamico.component';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-registrar-plan',
  templateUrl: './registrar-plan.component.html',
  styleUrl: './registrar-plan.component.css'
})
export class RegistrarPlanComponent implements OnInit {
  @ViewChild(FormularioDinamicoComponent) formularioDinamico!: FormularioDinamicoComponent;

  planId: string = '';
  formulario: Formulario | undefined;

  constructor(private route: ActivatedRoute,
    private modalService: ModalService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.planId = params['id'];
      this.loadFormulario(); // Cargar el formulario después de obtener el planId
    });
  }

  loadFormulario(): void {
    // Seleccionar el formulario basado en el valor del planId
    if (this.planId === '1') {
      this.formulario = formularioPAA1;
    } else if (this.planId === '2') {
      this.formulario = formularioPAA2;
    } else {
      console.error('No se encontró un formulario para el planId:', this.planId);
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
