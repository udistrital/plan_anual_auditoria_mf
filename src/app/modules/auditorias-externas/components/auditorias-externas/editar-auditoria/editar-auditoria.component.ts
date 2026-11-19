import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Formulario } from 'src/app/shared/data/models/formulario.model';
import {
  anioDeFecha,
  formatearTamanio,
  mensajesErrorRegistro,
  HallazgoExterno,
  pendientesParaContinuar,
  SeccionRegistro,
  RegistroAuditoriaExterna,
} from 'src/app/shared/data/models/registro-auditoria-externa';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AlertService } from 'src/app/shared/services/alert.service';
import { RolService } from 'src/app/core/services/rol.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { AuditoriaExternaService } from '../../../services/auditoria-externa.service';
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
  styleUrls: ['../../../vista-externa.css', './editar-auditoria.component.css'],
  standalone: false,
})
export class EditarAuditoriaComponent implements OnInit, OnDestroy {
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
  registro: RegistroAuditoriaExterna = {
    datosGenerales: null,
    hallazgos: [],
    informeFinal: null,
  };
  /** Verdadero cuando el registro ya se envió: no se pregunta al salir. */
  registroEnviado = false;
  /** Verdadero mientras se sube el informe y se envía el registro (evita el doble clic). */
  enviando = false;
  /** Informe ya subido a Nuxeo: si el registro falla y se reintenta, no se sube de nuevo. */
  private informeSubido: { nuxeo_id: number; nuxeo_enlace: string; nombre: string } | null = null;

  private vigenciaPreseleccionada: number | null = null;
  private readonly suscripciones = new Subscription();

  constructor(
    private readonly alertaService: AlertService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly rolService: RolService,
    private readonly userService: UserService,
    private readonly auditoriaExternaService: AuditoriaExternaService,
  ) {}

  ngOnInit(): void {
    // Copia propia: el formulario dinámico escribe las opciones dentro del objeto.
    this.formInformacion = JSON.parse(JSON.stringify(formularioInformacionAuditoria));
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

  // ── Resumen del encabezado (se lee del formulario, sin guardar nada) ───────────

  /** Código y nombre del ente, tal como se van escribiendo. */
  get entidadResumen(): string {
    const valor = this.formularioInformacionComponent?.form?.value ?? {};
    return [valor.codigo_entidad, valor.nombre_entidad]
      .map((texto) => String(texto ?? '').trim())
      .filter(Boolean)
      .join(' - ');
  }

  /** Fecha del informe final elegida, en formato corto. */
  get fechaInformeResumen(): string {
    const fecha = this.formularioInformacionComponent?.form?.value?.fecha_informe_final;
    if (!fecha || anioDeFecha(fecha) === null) return '';
    return new Date(fecha).toLocaleDateString('es-CO');
  }

  /** Nombre de la vigencia elegida (la lista llega del servicio de Parámetros). */
  get vigenciaNombre(): string {
    const id = this.formularioInformacionComponent?.form?.value?.vigencia;
    if (id === null || id === undefined || id === '') return '';
    const campo = this.formInformacion?.campos?.find((c) => c.nombre === 'vigencia');
    return campo?.parametros?.opciones?.find((o) => o.Id === id)?.Nombre ?? '';
  }

  /** Tamaño del PDF elegido, legible (p. ej. «1,2 MB»). */
  get tamanioInforme(): string {
    const informe = this.registro.informeFinal;
    return informe ? formatearTamanio(informe.tamanio) : '';
  }

  quitarInforme(): void {
    this.informeSubido = null;
    this.registro.informeFinal = null;
  }

  regresarRuta(): void {
    this.router.navigate(['/auditorias-externas']);
  }

  // ── Información general ─────────────────────────────────

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

  /** Dependencias distintas entre todos los hallazgos registrados. */
  get totalDependencias(): number {
    return new Set(this.registro.hallazgos.flatMap((h) => h.dependencias_nombre)).size;
  }

  /** Recibe el formulario ya validado (o null si faltan campos obligatorios). */
  guardarInformacion(dataForm: any): void {
    if (!dataForm) {
      this.registro.datosGenerales = null;
      this.validarYConfirmar();
      return;
    }
    this.registro.datosGenerales = {
      codigo_entidad: String(dataForm.codigo_entidad).trim(),
      nombre_entidad: String(dataForm.nombre_entidad).trim(),
      nombre_auditoria: String(dataForm.nombre_auditoria).trim(),
      fecha_informe_final: new Date(dataForm.fecha_informe_final).toISOString(),
      vigencia_id: Number(dataForm.vigencia),
    };
    this.validarYConfirmar();
  }

  // ── Hallazgos ───────────────────────────────────────────────

  onHallazgosActualizados(hallazgos: HallazgoExterno[]): void {
    this.registro.hallazgos = hallazgos;
  }

  // ── Informe final (PDF local, se sube a Nuxeo al continuar) ──

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
      this.informeSubido = null;
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
        data: { base64Document: informe.base64, nombre: informe.nombre, tamanio: this.tamanioInforme },
        width: '80%',
        height: '80vh',
      })
      .afterClosed()
      .subscribe((accion: AccionInformeModal | undefined) => {
        if (accion === 'cambiar') this.abrirSelectorInforme();
        if (accion === 'quitar') this.quitarInforme();
      });
  }

  // ── Continuar ───────────────────────────────────────────────────

  /** Valida el formulario (lo que dispara `guardarInformacion`) y luego el resto del registro. */
  continuar(): void {
    const formulario = this.formularioInformacionComponent;
    if (!formulario) return;
    formulario.onSubmit();
  }

  private validarYConfirmar(): void {
    const pendientes = pendientesParaContinuar(this.registro);
    if (pendientes.length) {
      this.alertaService.showErrorListAlert(
        'No es posible continuar',
        'Complete lo siguiente antes de continuar:',
        pendientes.map((p) => p.mensaje),
      );
      this.irASeccion(pendientes[0].seccion);
      return;
    }

    this.alertaService
      .showConfirmAlert(
        '¿Está seguro(a) de continuar? Se registrará la auditoría externa y se iniciará el plan de mejoramiento.',
      )
      .then((respuesta) => {
        if (respuesta.value) void this.enviarRegistro();
      });
  }

  /** Sube el informe a Nuxeo y envía el registro al MID; todo o nada en el servidor. */
  private async enviarRegistro(): Promise<void> {
    if (this.enviando) return;
    const rol = this.rolService.getRolPrioritario([
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
    ]);
    if (!rol) {
      this.alertaService.showErrorAlert('Su rol no permite registrar auditorías externas.');
      return;
    }

    this.enviando = true;
    try {
      const usuarioId = await this.userService.getPersonaId();
      const informe = this.registro.informeFinal!;
      if (!this.informeSubido) {
        const subido = await this.auditoriaExternaService.subirInforme(
          informe,
          this.registro.datosGenerales!.codigo_entidad,
        );
        this.informeSubido = { ...subido, nombre: informe.nombre };
      }
      await this.auditoriaExternaService.registrar(
        this.registro,
        { nuxeo_id: this.informeSubido.nuxeo_id, nuxeo_enlace: this.informeSubido.nuxeo_enlace },
        { id: usuarioId, rol },
      );
      this.registroEnviado = true;
      await this.alertaService.showSuccessAlert(
        'La auditoría externa quedó registrada y se creó su plan de mejoramiento.',
        'Registro exitoso',
      );
      this.router.navigate(['/auditorias-externas']);
    } catch (error) {
      const mensajes = mensajesErrorRegistro(error);
      if (mensajes.length > 1) {
        this.alertaService.showErrorListAlert(
          'No fue posible registrar la auditoría',
          'Corrija lo siguiente y vuelva a continuar:',
          mensajes,
        );
      } else {
        this.alertaService.showErrorAlert(mensajes[0]);
      }
    } finally {
      this.enviando = false;
    }
  }

  private irASeccion(seccion: SeccionRegistro): void {
    document.getElementById(`seccion-${seccion}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
