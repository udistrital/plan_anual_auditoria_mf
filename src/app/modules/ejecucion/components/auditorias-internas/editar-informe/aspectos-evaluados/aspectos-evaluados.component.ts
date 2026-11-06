import { Component, OnInit, OnChanges, OnDestroy, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { ReferenciaPdfService } from 'src/app/core/services/referencia-pdf.service';
import { esHtmlVacio } from 'src/app/shared/utils/html.util';

interface Hallazgo {
  _id?: string;
  auditoria_id?: string;
  subtema_id?: string;
  titulo: string;
  criterio: string;
  descripcion: string;
  activo?: boolean;
}

interface Subtema {
  _id?: string;
  activo?: boolean;
  titulo: string;
  descripcion?: string;
  hallazgos: Hallazgo[];
}

interface Tema {
  _id?: string;
  informe_id?: string;
  activo?: boolean;
  titulo: string;
  descripcion_titulo?: string;
  subtema: Subtema[];
}

@Component({
    selector: 'app-aspectos-evaluados',
    templateUrl: './aspectos-evaluados.component.html',
    styleUrls: ['./aspectos-evaluados.component.css'],
    standalone: false
})
export class AspectosEvaluadosComponent implements OnInit, OnChanges, OnDestroy {
  @Input() informeId!: string;
  @Input() auditoriaId!: string;
  @Input() soloLectura: boolean = false;
  @Input() temasRaw: any[] | null = null;
  @Input() hallazgosRaw: any[] | null = null;
  @Input() placeholder: string = 'Escribe aquí...';
  @Output() datosActualizados = new EventEmitter<void>();

  aspectosForm: UntypedFormGroup = this.fb.group({});
  temasData: Tema[] = [];
  cargando = false;
  // Guarda por tema el enlace de Nuxeo original y el HTML que se descargó de él
  private readonly documentosNuxeoTema = new Map<string, { enlace: string; html: string }>();
  // Temas cuya descripción no se pudo descargar del gestor documental: al guardar se conserva su enlace original
  private readonly descripcionesNoCargadas = new Map<string, string>();
  // Igual que documentosNuxeoTema, pero indexado por id de subtema
  private readonly documentosNuxeoSubtema = new Map<string, { enlace: string; html: string }>();
  // Subtemas cuya descripción no se pudo descargar del gestor documental: al guardar se conserva su enlace original
  private readonly descripcionesSubtemaNoCargadas = new Map<string, string>();
  errorMatcher: ErrorStateMatcher = {
    isErrorState(control: FormControl | null, _form: FormGroupDirective | NgForm | null): boolean {
      return !!(control?.invalid && (control?.dirty || control?.touched));
    }
  };

  private readonly ANCHO_MAX_IMG = 500;
  private observadores: MutationObserver[] = [];
  private botonPresionado = false;
  private revisores: Array<() => void> = [];

  private readonly alPresionar = () => { this.botonPresionado = true; };
  private readonly alSoltar = () => {
    this.botonPresionado = false;
    // Se espera un instante para no interferir con el cierre del arrastre de blotFormatter
    setTimeout(() => this.revisores.forEach(revisar => revisar()), 0);
  };

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // Botones de formato
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }], // Listas
      [{ header: [1, 2, 3, false] }], // Encabezados
      [{ align: [] }], // Alineación
      [{ color: [] }, { background: [] }], // Colores
      ['link', 'image'], // Enlace e imágenes
      ['clean'], // Eliminar formato
    ],
    blotFormatter: {
      align: {
        allowAligning: false,
      },
      resize: {
        allowResizing: true,
      },
      delete: {
        allowKeyboardDelete: true,
      },
      image: {
        allowAltTitleEdit: false,
        allowCompressor: false,
        linkOptions: {
          allowLinkEdit: false,
        }
      }
    }
  };

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    private readonly alertaService: AlertService,
    private readonly nuxeoService: NuxeoService,
    private readonly referenciaPdfService: ReferenciaPdfService,
  ) { }

  ngOnInit(): void {
    this.aspectosForm = this.fb.group({
      temas: this.fb.array([]),
    });
    this.actualizarModoSoloLectura();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['temasRaw'] || changes['hallazgosRaw']) && this.temasRaw !== null && this.hallazgosRaw !== null) {
      this.usarDatosProporcionados();
    }
    if (changes['soloLectura']) {
      this.actualizarModoSoloLectura();
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.alPresionar, true);
    document.removeEventListener('mouseup', this.alSoltar, true);
    this.observadores.forEach(o => o.disconnect());
    this.observadores = [];
    this.revisores = [];
  }

  private async usarDatosProporcionados(): Promise<void> {
    const temas: Tema[] = JSON.parse(JSON.stringify(this.temasRaw));
    for (const tema of temas) {
      for (const subtema of (tema.subtema ?? [])) {
        (subtema as any).hallazgo = (this.hallazgosRaw ?? []).filter(
          (h: any) => h.subtema_id?.toString() === (subtema as any)._id?.toString() && h.activo !== false
        );
      }
    }
    this.temasData = temas;
    await this.construirFormulario();
    this.actualizarModoSoloLectura();
  }

  private actualizarModoSoloLectura(): void {
    if (!this.aspectosForm) return;

    if (this.soloLectura) {
      this.aspectosForm.disable({ emitEvent: false });
      return;
    }

    this.aspectosForm.enable({ emitEvent: false });
  }

  // Carga temas y luego hallazgos (colección separada)
  cargarTemas(): void {
    if (!this.informeId) return;

    this.cargando = true;
    this.planAnualAuditoriaService.get(`tema?query=informe_id:${this.informeId}`).subscribe({
      next: async (response: any) => {
        const temas = response?.Data ?? [];

        // Cargar hallazgos de cada tema en paralelo y asignarlos a sus subtemas
        await this.asignarHallazgosASubtemas(temas);

        this.temasData = temas;
        await this.construirFormulario();
        this.actualizarModoSoloLectura();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar temas:', error);
        this.cargando = false;
      }
    });
  }

  // Carga todos los hallazgos del informe en 1 query y los distribuye en los subtemas
  private async asignarHallazgosASubtemas(temas: any[]): Promise<void> {
    let hallazgosTotales: any[] = [];
    try {
      const resp: any = await firstValueFrom(
        this.planAnualAuditoriaService.get(`hallazgo?query=informe_id:${this.informeId}`)
      );
      hallazgosTotales = resp?.Data ?? [];
    } catch {
      hallazgosTotales = [];
    }

    for (const tema of temas) {
      for (const subtema of (tema.subtema ?? [])) {
        const subtemaIdStr = subtema._id?.toString();
        subtema.hallazgo = hallazgosTotales.filter(
          (h: any) => h.subtema_id?.toString() === subtemaIdStr && h.activo !== false
        );
      }
    }
  }

  // Construye el formulario reactivo con los datos cargados
  async construirFormulario(): Promise<void> {
    this.documentosNuxeoTema.clear();
    this.descripcionesNoCargadas.clear();
    this.documentosNuxeoSubtema.clear();
    this.descripcionesSubtemaNoCargadas.clear();

    this.observadores.forEach(o => o.disconnect());
    this.observadores = [];
    this.revisores = [];

    const temasActivos = this.temasData.filter(tema => tema.activo);

    const gruposTemas = await Promise.all(temasActivos.map(async (tema) => {
      const subtemasArray = this.fb.array([]);

      for (const subtema of (tema.subtema ?? []) as any[]) {
        if (!subtema.activo) continue;

        if (subtema.descripcion && this.comprobarNuxeoEnlace(subtema.descripcion)) {
          const enlaceOriginal = subtema.descripcion;
          try {
            let html = await this.obtenerDocumentoHTML(enlaceOriginal);
            html = html.replace(/style="width:\s*(\d+)px;?"/g, 'width="$1px"');
            subtema.descripcion = html;
            if (subtema._id) {
              this.documentosNuxeoSubtema.set(subtema._id.toString(), { enlace: enlaceOriginal, html });
            }
          } catch (error) {
            // Si el gestor documental falla, el subtema se muestra igual (sin su descripción) en vez de dejar vacío el paso
            console.error(`No se pudo cargar la descripción del subtema "${subtema.titulo}":`, error);
            if (subtema._id) {
              this.descripcionesSubtemaNoCargadas.set(subtema._id.toString(), enlaceOriginal);
            }
          }
        }

        const hallazgosArray = this.fb.array([]);

        (subtema.hallazgo ?? []).forEach((hallazgo: any) => {
          if (!hallazgo.activo) return;

          hallazgosArray.push(this.fb.group({
            _id: [hallazgo._id ?? null],
            criterio: [hallazgo.criterio ?? '', Validators.required],
            hallazgo: [hallazgo.titulo ?? '', Validators.required],
            descripcion: [hallazgo.descripcion ?? '', Validators.required],
          }));
        });

        subtemasArray.push(this.fb.group({
          _id: [subtema._id ?? null],
          nombre: [subtema.titulo ?? '', Validators.required],
          descripcion: [subtema.descripcion ?? ''],
          hallazgos: hallazgosArray,
        }));
      }

      if (tema.descripcion_titulo && this.comprobarNuxeoEnlace(tema.descripcion_titulo)) {
        const enlaceOriginal = tema.descripcion_titulo;
        try {
          let html = await this.obtenerDocumentoHTML(enlaceOriginal);
          html = html.replace(/style="width:\s*(\d+)px;?"/g, 'width="$1px"');
          tema.descripcion_titulo = html;
          if (tema._id) {
            this.documentosNuxeoTema.set(tema._id.toString(), { enlace: enlaceOriginal, html });
          }
        } catch (error) {
          // Si el gestor documental falla, el tema se muestra igual (sin su descripción) en vez de dejar vacío el paso
          console.error(`No se pudo cargar la descripción del tema "${tema.titulo}":`, error);
          if (tema._id) {
            this.descripcionesNoCargadas.set(tema._id.toString(), enlaceOriginal);
          }
        }
      }

      return this.fb.group({
        _id: [tema._id ?? null],
        nombre: [tema.titulo ?? '', Validators.required],
        descripcion_titulo: [tema.descripcion_titulo ?? ''],
        subtemas: subtemasArray,
      });
    }));

    const temasArray = this.fb.array(gruposTemas);

    this.aspectosForm = this.fb.group({
      temas: temasArray,
    });

    this.actualizarModoSoloLectura();

    if (this.descripcionesNoCargadas.size > 0 || this.descripcionesSubtemaNoCargadas.size > 0) {
      const afectados = [
        this.descripcionesNoCargadas.size > 0 ? `${this.descripcionesNoCargadas.size} tema(s)` : '',
        this.descripcionesSubtemaNoCargadas.size > 0 ? `${this.descripcionesSubtemaNoCargadas.size} subtema(s)` : '',
      ].filter(Boolean).join(' y ');
      this.alertaService.showAlert(
        'Descripción no disponible',
        `No se pudo cargar desde el gestor documental la descripción de ${afectados}. ` +
        'Se conserva sin cambios al guardar; intente de nuevo más tarde para editarla.'
      );
    }
  }

  // Indica si la descripción del tema no se pudo descargar del gestor documental
  descripcionNoDisponible(tema: AbstractControl): boolean {
    const temaId = tema.get('_id')?.value;
    return !!temaId && this.descripcionesNoCargadas.has(String(temaId));
  }

  // Indica si la descripción del subtema no se pudo descargar del gestor documental
  descripcionSubtemaNoDisponible(subtema: AbstractControl): boolean {
    const subtemaId = subtema.get('_id')?.value;
    return !!subtemaId && this.descripcionesSubtemaNoCargadas.has(String(subtemaId));
  }

  get temas(): UntypedFormArray {
    return this.aspectosForm.get('temas') as UntypedFormArray;
  }

  agregarTema(): void {
    if (this.soloLectura) return;

    const nuevoTema = this.fb.group({
      _id: [null],
      nombre: ['', Validators.required],
      descripcion_titulo: [''],
      subtemas: this.fb.array([]),
    });
    this.temas.push(nuevoTema);
  }

  getSubtemas(temaIndex: number): UntypedFormArray {
    return this.temas.at(temaIndex).get('subtemas') as UntypedFormArray;
  }

  agregarSubtema(temaIndex: number): void {
    if (this.soloLectura) return;

    const nuevoSubtema = this.fb.group({
      _id: [null],
      nombre: ['', Validators.required],
      descripcion: [''],
      hallazgos: this.fb.array([]),
    });
    this.getSubtemas(temaIndex).push(nuevoSubtema);
  }

  getHallazgos(temaIndex: number, subtemaIndex: number): UntypedFormArray {
    return this.getSubtemas(temaIndex).at(subtemaIndex).get('hallazgos') as UntypedFormArray;
  }

  agregarHallazgo(temaIndex: number, subtemaIndex: number): void {
    if (this.soloLectura) return;

    const nuevoHallazgo = this.fb.group({
      _id: [null],
      criterio: ['', Validators.required],
      hallazgo: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
    this.getHallazgos(temaIndex, subtemaIndex).push(nuevoHallazgo);
  }

  // Elimina un tema y sus subtemas/hallazgos en cascada
  eliminarTema(index: number): void {
    if (this.soloLectura) return;

    const tema = this.temas.at(index);
    const temaId = tema.get('_id')?.value;

    if (temaId) {
      this.alertaService.showConfirmAlert('¿Eliminar este tema y todos sus subtemas y hallazgos?')
        .then((confirmado) => {
          if (!confirmado.value) return;

          this.planAnualAuditoriaService.delete('tema', { id: temaId }).subscribe({
            next: () => {
              this.temas.removeAt(index);
              this.alertaService.showAlert('Eliminado', 'El tema ha sido eliminado correctamente');
              this.datosActualizados.emit();
            },
            error: (error) => {
              console.error('Error al eliminar tema:', error);
              this.alertaService.showAlert('Error', 'No se pudo eliminar el tema');
            }
          });
        });
    } else {
      this.temas.removeAt(index);
    }
  }

  // Elimina un subtema y sus hallazgos en cascada
  eliminarSubtema(temaIndex: number, subtemaIndex: number): void {
    if (this.soloLectura) return;

    const subtema = this.getSubtemas(temaIndex).at(subtemaIndex);
    const subtemaId = subtema.get('_id')?.value;

    if (subtemaId) {
      this.alertaService.showConfirmAlert('¿Eliminar este subtema y todos sus hallazgos?')
        .then((confirmado) => {
          if (!confirmado.value) return;

          this.planAnualAuditoriaService.delete('subtema', { id: subtemaId }).subscribe({
            next: () => {
              this.getSubtemas(temaIndex).removeAt(subtemaIndex);
              this.alertaService.showAlert('Eliminado', 'El subtema ha sido eliminado correctamente');
              this.datosActualizados.emit();
            },
            error: (error) => {
              console.error('Error al eliminar subtema:', error);
              this.alertaService.showAlert('Error', 'No se pudo eliminar el subtema');
            }
          });
        });
    } else {
      this.getSubtemas(temaIndex).removeAt(subtemaIndex);
    }
  }

  // Elimina un hallazgo
  eliminarHallazgo(temaIndex: number, subtemaIndex: number, hallazgoIndex: number): void {
    if (this.soloLectura) return;

    const hallazgo = this.getHallazgos(temaIndex, subtemaIndex).at(hallazgoIndex);
    const hallazgoId = hallazgo.get('_id')?.value;

    if (hallazgoId) {
      this.alertaService.showConfirmAlert('¿Eliminar este hallazgo?')
        .then((confirmado) => {
          if (!confirmado.value) return;

          this.planAnualAuditoriaService.delete('hallazgo', { id: hallazgoId }).subscribe({
            next: () => {
              this.getHallazgos(temaIndex, subtemaIndex).removeAt(hallazgoIndex);
              this.alertaService.showAlert('Eliminado', 'El hallazgo ha sido eliminado correctamente');
              this.datosActualizados.emit();
            },
            error: (error) => {
              console.error('Error al eliminar hallazgo:', error);
              this.alertaService.showAlert('Error', 'No se pudo eliminar el hallazgo');
            }
          });
        });
    } else {
      this.getHallazgos(temaIndex, subtemaIndex).removeAt(hallazgoIndex);
    }
  }

  // Guarda todos los aspectos evaluados (temas, subtemas, hallazgos)
  async guardarAspectos(): Promise<boolean> {
    if (this.soloLectura) {
      return true;
    }

    if (this.aspectosForm.invalid) {
      this.aspectosForm.markAllAsTouched();
      this.alertaService.showAlert('Formulario inválido', 'Por favor complete todos los campos requeridos');
      return false;
    }

    const temasFormValue = this.temas.value;
    // Lo que no se pudo guardar y por qué: se informa al final en un solo mensaje
    const fallos: string[] = [];

    for (let i = 0; i < temasFormValue.length; i++) {
      const temaForm = temasFormValue[i];
      let temaId = temaForm._id;

      // Crear o actualizar tema
      if (!temaId) {
        let descripcion = esHtmlVacio(temaForm.descripcion_titulo) ? '' : temaForm.descripcion_titulo;
        try {
          if (this.contieneImagen(descripcion)) {
            descripcion = await this.subirHtmlANuxeo(descripcion, `Tema ${i + 1} de informe ${this.informeId}.html`, 'Documento HTML (Aspectos Evaluados) de un tema');
          }
        } catch (error) {
          console.error('Error al subir la descripción del tema al gestor documental:', error);
          fallos.push(`Tema "${temaForm.nombre}": no se pudo guardar la imagen de la descripción en el gestor documental. No se creó el tema ni sus subtemas y hallazgos.`);
          continue;
        }
        try {
          const response: any = await firstValueFrom(this.planAnualAuditoriaService.post('tema', {
            informe_id: this.informeId,
            titulo: temaForm.nombre,
            descripcion_titulo: descripcion
          }));
          temaId = response?.Data?._id || response?._id;
          this.temas.at(i).patchValue({ _id: temaId, isNew: false });
        } catch (error) {
          console.error('Error al crear tema:', error);
          fallos.push(`Tema "${temaForm.nombre}": no se pudo crear en la base de datos. Tampoco se guardaron sus subtemas y hallazgos.`);
          continue;
        }
      } else {
        let descripcion = esHtmlVacio(temaForm.descripcion_titulo) ? '' : temaForm.descripcion_titulo;
        const original = this.documentosNuxeoTema.get(String(temaId));
        const enlaceNoCargado = this.descripcionesNoCargadas.get(String(temaId));
        let actualizarTema = true;

        if (enlaceNoCargado) {
          // La descripción no se pudo descargar: se conserva el documento de Nuxeo tal como estaba
          descripcion = enlaceNoCargado;
        } else if (original && descripcion === original.html) {
          // Sin cambios en el contenido: se reutiliza el documento existente en Nuxeo
          descripcion = original.enlace;
        } else if (this.contieneImagen(descripcion)) {
          const htmlGuardado = descripcion;
          try {
            descripcion = await this.subirHtmlANuxeo(htmlGuardado, `Tema ${i + 1} de informe ${this.informeId}.html`, 'Documento HTML (Aspectos Evaluados) de un tema');
            this.documentosNuxeoTema.set(String(temaId), { enlace: descripcion, html: htmlGuardado });
          } catch (error) {
            console.error('Error al subir la descripción del tema al gestor documental:', error);
            fallos.push(`Tema "${temaForm.nombre}": no se pudo guardar la imagen de la descripción en el gestor documental. El tema conserva su versión anterior.`);
            actualizarTema = false;
          }
        }

        if (actualizarTema) {
          try {
            await firstValueFrom(this.planAnualAuditoriaService.put(`tema/${temaId}`, {
              titulo: temaForm.nombre,
              descripcion_titulo: descripcion
            }));
          } catch (error) {
            console.error('Error al actualizar tema:', error);
            fallos.push(`Tema "${temaForm.nombre}": no se pudo actualizar en la base de datos.`);
          }
        }
      }

      // Procesar subtemas
      for (let j = 0; j < temaForm.subtemas.length; j++) {
        const subtemaForm = temaForm.subtemas[j];
        let subtemaId = subtemaForm._id;
        let descripcionSubtema = esHtmlVacio(subtemaForm.descripcion) ? '' : subtemaForm.descripcion;
        const nombreDocumentoSubtema = `Subtema ${i + 1}.${j + 1} de informe ${this.informeId}.html`;
        const descripcionDocumentoSubtema = 'Documento HTML (Aspectos Evaluados) de un subtema';

        // Crear o actualizar subtema
        if (!subtemaId) {
          try {
            if (this.contieneImagen(descripcionSubtema)) {
              descripcionSubtema = await this.subirHtmlANuxeo(descripcionSubtema, nombreDocumentoSubtema, descripcionDocumentoSubtema);
            }

            const response: any = await firstValueFrom(this.planAnualAuditoriaService.post('subtema', {
              tema_id: temaId,
              titulo: subtemaForm.nombre,
              descripcion: descripcionSubtema
            }));
            // El servidor devuelve el tema con los subtemas embebidos; el nuevo es el último
            const subtemasEnResponse = response?.Data?.subtema ?? [];
            subtemaId = subtemasEnResponse[subtemasEnResponse.length - 1]?._id;
            this.getSubtemas(i).at(j).patchValue({ _id: subtemaId, isNew: false });
          } catch (error) {
            console.error('Error al crear subtema:', error);
            fallos.push(`Subtema "${subtemaForm.nombre}": no se pudo crear en la base de datos. Tampoco se guardaron sus hallazgos.`);
            continue;
          }
        } else {
          try {
            const original = this.documentosNuxeoSubtema.get(String(subtemaId));
            const enlaceNoCargado = this.descripcionesSubtemaNoCargadas.get(String(subtemaId));

            if (enlaceNoCargado) {
              // La descripción no se pudo descargar: se conserva el documento de Nuxeo tal como estaba
              descripcionSubtema = enlaceNoCargado;
            } else if (original && descripcionSubtema === original.html) {
              // Sin cambios en el contenido: se reutiliza el documento existente en Nuxeo
              descripcionSubtema = original.enlace;
            } else if (this.contieneImagen(descripcionSubtema)) {
              const htmlGuardado = descripcionSubtema;
              descripcionSubtema = await this.subirHtmlANuxeo(htmlGuardado, nombreDocumentoSubtema, descripcionDocumentoSubtema);
              this.documentosNuxeoSubtema.set(String(subtemaId), { enlace: descripcionSubtema, html: htmlGuardado });
            }

            await firstValueFrom(this.planAnualAuditoriaService.put(`subtema/${subtemaId}`, {
              titulo: subtemaForm.nombre,
              descripcion: descripcionSubtema
            }));
          } catch (error) {
            console.error('Error al actualizar subtema:', error);
            fallos.push(`Subtema "${subtemaForm.nombre}": no se pudo actualizar en la base de datos.`);
          }
        }

        // Procesar hallazgos
        for (let k = 0; k < subtemaForm.hallazgos.length; k++) {
          const hallazgoForm = subtemaForm.hallazgos[k];
          let hallazgoId = hallazgoForm._id;

          if (!hallazgoId) {
            try {
              const response: any = await firstValueFrom(this.planAnualAuditoriaService.post('hallazgo', {
                auditoria_id: this.auditoriaId,
                informe_id: this.informeId,
                subtema_id: subtemaId,
                titulo: hallazgoForm.hallazgo,
                criterio: hallazgoForm.criterio,
                descripcion: hallazgoForm.descripcion
              }));
              // El servidor devuelve el hallazgo creado directamente
              hallazgoId = response?.Data?._id;
              this.getHallazgos(i, j).at(k).patchValue({ _id: hallazgoId, isNew: false });
            } catch (error) {
              console.error('Error al crear hallazgo:', error);
              fallos.push(`Hallazgo "${hallazgoForm.hallazgo}": no se pudo crear en la base de datos.`);
            }
          } else {
            try {
              await firstValueFrom(this.planAnualAuditoriaService.put(`hallazgo/${hallazgoId}`, {
                titulo: hallazgoForm.hallazgo,
                criterio: hallazgoForm.criterio,
                descripcion: hallazgoForm.descripcion
              }));
            } catch (error) {
              console.error('Error al actualizar hallazgo:', error);
              fallos.push(`Hallazgo "${hallazgoForm.hallazgo}": no se pudo actualizar en la base de datos.`);
            }
          }
        }
      }
    }

    if (fallos.length > 0) {
      // No se recargan los datos: lo que no se guardó sigue en el formulario para reintentarlo
      this.alertaService.showErrorListAlert(
        'No se guardó todo',
        'Lo demás quedó guardado. Revise lo siguiente y vuelva a intentarlo:',
        fallos
      );
      return false;
    }

    this.alertaService.showAlert('Guardado exitoso', 'Los aspectos evaluados se han guardado correctamente');
    this.datosActualizados.emit();
    return true;
  }

  // Sube el HTML de una descripción (con imágenes) a Nuxeo y devuelve el valor a guardar en la descripción
  private async subirHtmlANuxeo(htmlOriginal: string, nombre: string, descripcionDocumento: string): Promise<string> {
    let html = String(htmlOriginal);
    html = html.replace(/width="(\d+)px"/g, 'style="width:$1px;"');
    html = html.replace(/\sheight="auto"/g, '');

    const blob = new Blob([html], { type: 'text/html' });
    const htmlFile = new File([blob], 'archivo.html', { type: 'text/html' });
    const base64 = await this.nuxeoService.fileABase64(htmlFile) as string;

    const payload = {
      IdTipoDocumento: environment.TIPO_DOCUMENTO.INFORMES,
      nombre,
      descripcion: descripcionDocumento,
      metadatos: {},
      file: JSON.stringify(base64)
    };

    const response: any = await firstValueFrom(this.nuxeoService.guardarArchivos([payload]));
    const enlace = response?.[0]?.res?.Enlace;
    if (!enlace) throw new Error('Nuxeo no devolvió el enlace del documento');

    return `NuxeoEnlace:${enlace}`;
  }

  private contieneImagen(html: string): boolean {
    if (!html) return false;
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.querySelector('img') !== null;
  }

  private comprobarNuxeoEnlace(descripcion: any): boolean {
    return descripcion?.startsWith("NuxeoEnlace") ?? false;
  }

  private async obtenerDocumentoHTML(descripcion: any) {
    const indice = descripcion.indexOf(":");
    const uuid = descripcion.substring(indice + 1);
    const documento = await this.nuxeoService.obtenerPorUUID(uuid);

    const bytes = Uint8Array.from(atob(documento), c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }

  onEditorCreated(quill: any): void {
    const root: HTMLElement = quill.root;

    const limitar = (img: HTMLImageElement) => {
      const aplicar = () => {
        const explicito = parseInt(img.getAttribute('width') || img.style.width || '', 10);
        // Si no tiene ancho definido, se usa el tamaño natural de la imagen
        const ancho = explicito > 0 ? explicito : img.naturalWidth;
        if (ancho > this.ANCHO_MAX_IMG) {
          img.style.removeProperty('width');
          img.setAttribute('width', `${this.ANCHO_MAX_IMG}px`);
        }
      };

      // Si todavía no cargó, se espera a que cargue para conocer su tamaño real
      if (img.complete && img.naturalWidth > 0) {
        aplicar();
      } else {
        img.addEventListener('load', aplicar, { once: true });
      }
    };

    // Imágenes que ya existen al cargar el contenido
    root.querySelectorAll('img').forEach(limitar);

    this.revisores.push(() => root.querySelectorAll('img').forEach(limitar));

    // Cada vez que cambie el ancho (arrastrando) o se agregue una imagen, se corrige
    const observador = new MutationObserver((mutaciones) => {
      if (this.botonPresionado) return;

      for (const m of mutaciones) {
        if (m.type === 'attributes' && m.target instanceof HTMLImageElement) {
          limitar(m.target);
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((n) => {
            if (n instanceof HTMLImageElement) limitar(n);
            else if (n instanceof HTMLElement) n.querySelectorAll('img').forEach(limitar);
          });
        }
      }
    });
    observador.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['width', 'style'],
    });
    this.observadores.push(observador);
  }
}