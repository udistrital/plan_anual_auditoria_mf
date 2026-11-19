import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Formulario } from 'src/app/shared/data/models/formulario.model';
import {
  anioDeFecha,
  HallazgoExterno,
  pendientesParaContinuar,
  RegistroAuditoriaExterna,
} from 'src/app/shared/data/models/registro-auditoria-externa';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AlertService } from 'src/app/shared/services/alert.service';
import { formularioInformacionAuditoria } from './editar-auditoria.utilidades';
import {
  AccionInformeModal,
  ModalVisualizarRecargarInformeAuditoriaComponent,
} from './modal-visualizar-recargar-informe-auditoria/modal-visualizar-recargar-informe-auditoria.component';

/**
 * Registro de una auditoría externa (#953). Todo queda en memoria hasta Continuar:
 * no existe un estado previo ni borrador en base de datos.
 */
@Component({
  selector: 'app-editar-auditoria',
  templateUrl: './editar-auditoria.component.html',
  styleUrls: ['./editar-auditoria.component.css'],
  standalone: false,
})
export class EditarAuditoriaComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('inputInforme') inputInforme?: ElementRef<HTMLInputElement>;

  /** Se enlaza apenas el formulario dinámico existe (vive dentro de una plantilla). */
  @ViewChild('formularioInformacionComp')
  set formularioInformacionRef(componente: FormularioDinamicoComponent | undefined) {
    if (componente && componente !== this.formularioInformacionComponent) {
      this.formularioInformacionComponent = componente;
      this.enlazarFormulario(componente);
    }
  }
  formularioInformacionComponent?: FormularioDinamicoComponent;

  formInformacion?: Formulario;
  auditoriaId: string | null = null;
  esLineal = false;
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  registro: RegistroAuditoriaExterna = {
    datosGenerales: null,
    hallazgos: [],
    informeFinal: null,
  };
  /** Verdadero cuando el registro ya se envió: no se pregunta al salir. */
  registroEnviado = false;

  private vigenciaPreseleccionada: number | null = null;
  private readonly suscripciones = new Subscription();

  constructor(
    private readonly alertaService: AlertService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    // Copia propia: el formulario dinámico escribe las opciones dentro del objeto.
    this.formInformacion = JSON.parse(JSON.stringify(formularioInformacionAuditoria));
    this.manejarResponsiveStepper();
    this.auditoriaId = this.route.snapshot.paramMap.get('id');
    const vigencia = Number(this.route.snapshot.queryParamMap.get('vigencia'));
    this.vigenciaPreseleccionada = Number.isFinite(vigencia) && vigencia > 0 ? vigencia : null;
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  /** Avisa al recargar o cerrar la pestaña con información sin guardar. */
  @HostListener('window:beforeunload', ['$event'])
  avisarAntesDeCerrar(evento: BeforeUnloadEvent): void {
    if (this.tieneInformacionSinGuardar()) evento.preventDefault();
  }

  tieneInformacionSinGuardar(): boolean {
    if (this.registroEnviado) return false;
    const formulario = this.formularioInformacionComponent?.form;
    return !!(
      this.registro.datosGenerales ||
      this.registro.hallazgos.length ||
      this.registro.informeFinal ||
      formulario?.dirty
    );
  }

  /** Usado por la guarda de la ruta: pregunta antes de abandonar el registro. */
  puedeSalir(): boolean | Promise<boolean> {
    if (!this.tieneInformacionSinGuardar()) return true;
    return this.alertaService
      .showConfirmAlert('Hay información sin guardar. Si sale ahora la perderá. ¿Desea salir?')
      .then((respuesta) => !!respuesta.value);
  }

  regresarRuta(): void {
    this.router.navigate(['/auditorias-externas']);
  }

  manejarResponsiveStepper(): void {
    this.suscripciones.add(
      this.breakpointObserver.observe(['(max-width: 992px)']).subscribe((resultado) => {
        this.orientation = resultado.matches ? 'vertical' : 'horizontal';
      }),
    );
  }

  // ── Paso 1: información general ─────────────────────────────────

  private enlazarFormulario(componente: FormularioDinamicoComponent): void {
    const form = componente.form;
    if (!form) return;

    const datos = this.registro.datosGenerales;
    if (datos) {
      form.patchValue({
        codigo_entidad: datos.codigo_entidad,
        nombre_entidad: datos.nombre_entidad,
        nombre_auditoria: datos.nombre_auditoria,
        fecha_informe_final: new Date(datos.fecha_informe_final),
        vigencia: datos.vigencia_id,
      });
    } else if (this.vigenciaPreseleccionada) {
      form.patchValue({ vigencia: this.vigenciaPreseleccionada });
    }

    // La vigencia se sugiere con el año de la fecha del informe, mientras el auditor no la elija.
    const fecha = form.get('fecha_informe_final');
    if (fecha) {
      this.suscripciones.add(
        fecha.valueChanges.subscribe((valor) => this.sugerirVigencia(valor)),
      );
    }
  }

  private sugerirVigencia(fecha: Date | string | null): void {
    const form = this.formularioInformacionComponent?.form;
    const control = form?.get('vigencia');
    const anio = anioDeFecha(fecha);
    if (!control || control.dirty || anio === null) return;

    const campo = this.formInformacion?.campos?.find((c) => c.nombre === 'vigencia');
    const opcion = campo?.parametros?.opciones?.find((o) => String(o.Nombre) === String(anio));
    if (opcion?.Id !== undefined) control.setValue(opcion.Id);
  }

  enviarFormInformacion(): void {
    this.formularioInformacionComponent?.onSubmit();
  }

  /** Recibe el formulario ya validado (o null si faltan campos obligatorios). */
  guardarInformacion(dataForm: any): void {
    if (!dataForm) {
      this.alertaService.showAlert(
        'Formulario incompleto',
        'Debe llenar todos los campos obligatorios',
      );
      return;
    }
    this.registro.datosGenerales = {
      codigo_entidad: String(dataForm.codigo_entidad).trim(),
      nombre_entidad: String(dataForm.nombre_entidad).trim(),
      nombre_auditoria: String(dataForm.nombre_auditoria).trim(),
      fecha_informe_final: new Date(dataForm.fecha_informe_final).toISOString(),
      vigencia_id: Number(dataForm.vigencia),
    };
    this.stepper.next();
  }

  // ── Paso 2 y 3: hallazgos ───────────────────────────────────────

  onHallazgosActualizados(hallazgos: HallazgoExterno[]): void {
    this.registro.hallazgos = hallazgos;
  }

  // ── Paso 4: informe final (PDF local, se sube a Nuxeo al continuar) ──

  abrirSelectorInforme(): void {
    this.inputInforme?.nativeElement.click();
  }

  seleccionarInforme(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    if (archivo.type !== 'application/pdf') {
      this.alertaService.showErrorAlert('Solo se permiten archivos en formato PDF.');
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const contenido = String(lector.result ?? '');
      this.registro.informeFinal = {
        nombre: archivo.name,
        base64: contenido.split(',')[1] ?? '',
        tamanio: archivo.size,
      };
    };
    lector.onerror = () => this.alertaService.showErrorAlert('No fue posible leer el archivo.');
    lector.readAsDataURL(archivo);
  }

  verInformeAuditoria(): void {
    const informe = this.registro.informeFinal;
    if (!informe) return;
    this.dialog
      .open(ModalVisualizarRecargarInformeAuditoriaComponent, {
        data: { base64Document: informe.base64, nombre: informe.nombre },
        width: '80%',
        height: '80vh',
      })
      .afterClosed()
      .subscribe((accion: AccionInformeModal | undefined) => {
        if (accion === 'cambiar') this.abrirSelectorInforme();
        if (accion === 'quitar') this.registro.informeFinal = null;
      });
  }

  // ── Continuar ───────────────────────────────────────────────────

  continuar(): void {
    const pendientes = pendientesParaContinuar(this.registro);
    if (pendientes.length) {
      this.alertaService.showErrorListAlert(
        'No es posible continuar',
        'Complete lo siguiente antes de continuar:',
        pendientes,
      );
      return;
    }

    this.alertaService
      .showConfirmAlert(
        '¿Está seguro(a) de continuar? Se registrará la auditoría externa y se iniciará el plan de mejoramiento.',
      )
      .then((respuesta) => {
        if (!respuesta.value) return;
        // TODO(T1.9): subir el PDF a Nuxeo y enviar el registro al MID (POST /auditoria-externa).
        this.alertaService.showNotification(
          'Registro completo',
          'La información está completa. El envío al servicio se habilita en la siguiente tarea.',
        );
      });
  }
}
