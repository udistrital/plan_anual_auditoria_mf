import { Component, OnInit, OnChanges, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';

interface Subtema {
  _id?: string;
  tema_id?: string;
  activo?: boolean;
  titulo: string;
  isNew?: boolean;
  isModified?: boolean;
}

interface Tema {
  _id?: string;
  informe_id?: string;
  activo?: boolean;
  titulo: string;
  descripcion_titulo?: string;
  subtema: Subtema[];
  isNew?: boolean;
  isModified?: boolean;
}

@Component({
    selector: 'app-aspectos-evaluados-seguimiento',
    templateUrl: './aspectos-evaluados-seguimiento.component.html',
    styleUrls: ['./aspectos-evaluados-seguimiento.component.css'],
    standalone: false
})
export class AspectosEvaluadosSeguimientoComponent implements OnInit, OnChanges {
  @Input() informeId!: string;
  @Input() soloLectura: boolean = false;
  @Input() placeholder: string = 'Escribe aquí...';
  @Output() datosActualizados = new EventEmitter<void>();

  aspectosForm: UntypedFormGroup = this.fb.group({});
  temasData: Tema[] = [];
  cargando = false;
  // Guarda por tema el enlace de Nuxeo original y el HTML que se descargó de él
  private readonly documentosNuxeoTema = new Map<string, { enlace: string; html: string }>();
  // Temas cuya descripción no se pudo descargar del gestor documental: al guardar se conserva su enlace original
  private readonly descripcionesNoCargadas = new Map<string, string>();
  errorMatcher: ErrorStateMatcher = {
    isErrorState(control: FormControl | null, _form: FormGroupDirective | NgForm | null): boolean {
      return !!(control?.invalid && (control?.dirty || control?.touched));
    }
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
  ) { }

  ngOnInit(): void {
    this.aspectosForm = this.fb.group({
      temas: this.fb.array([]),
    });

    this.actualizarModoSoloLectura();

    if (this.informeId) {
      this.cargarTemas();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['informeId'] && this.informeId) {
      this.cargarTemas();
    }
    if (changes['soloLectura']) {
      this.actualizarModoSoloLectura();
    }
  }

  cargarTemas(): void {
    if (!this.informeId) return;

    this.cargando = true;
    this.planAnualAuditoriaService.get(`tema?query=informe_id:${this.informeId}`).subscribe({
      next: async (response: any) => {
        this.temasData = response?.Data ?? [];
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

  private actualizarModoSoloLectura(): void {
    if (!this.aspectosForm) return;

    if (this.soloLectura) {
      this.aspectosForm.disable({ emitEvent: false });
      return;
    }

    this.aspectosForm.enable({ emitEvent: false });
  }

  async construirFormulario(): Promise<void> {
    this.documentosNuxeoTema.clear();
    this.descripcionesNoCargadas.clear();

    const temasActivos = this.temasData.filter(tema => tema.activo);

    // Promise.all conserva el orden de los temas aunque sus descripciones lleguen de Nuxeo en distinto orden
    const gruposTemas = await Promise.all(temasActivos.map(async (tema) => {
      const subtemasArray = this.fb.array([]);

      (tema.subtema ?? []).forEach((subtema: any) => {
        if (!subtema.activo) return;

        subtemasArray.push(this.fb.group({
          _id: [subtema._id ?? null],
          nombre: [subtema.titulo ?? '', Validators.required],
          isNew: [false],
          isModified: [false],
        }));
      });

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
        isNew: [false],
        isModified: [false],
      });
    }));

    this.aspectosForm = this.fb.group({ temas: this.fb.array(gruposTemas) });

    if (this.descripcionesNoCargadas.size > 0) {
      this.alertaService.showAlert(
        'Descripción no disponible',
        `No se pudo cargar desde el gestor documental la descripción de ${this.descripcionesNoCargadas.size} tema(s). ` +
        'Se conserva sin cambios al guardar; intente de nuevo más tarde para editarla.'
      );
    }
  }

  // Indica si la descripción del tema no se pudo descargar del gestor documental
  descripcionNoDisponible(tema: AbstractControl): boolean {
    const temaId = tema.get('_id')?.value;
    return !!temaId && this.descripcionesNoCargadas.has(String(temaId));
  }

  get temas(): UntypedFormArray {
    return this.aspectosForm.get('temas') as UntypedFormArray;
  }

  agregarTema(): void {
    this.temas.push(this.fb.group({
      _id: [null],
      nombre: ['', Validators.required],
      descripcion_titulo: [''],
      subtemas: this.fb.array([]),
      isNew: [true],
      isModified: [false],
    }));
  }

  getSubtemas(temaIndex: number): UntypedFormArray {
    return this.temas.at(temaIndex).get('subtemas') as UntypedFormArray;
  }

  agregarSubtema(temaIndex: number): void {
    this.getSubtemas(temaIndex).push(this.fb.group({
      _id: [null],
      nombre: ['', Validators.required],
      isNew: [true],
      isModified: [false],
    }));
  }

  eliminarTema(index: number): void {
    const temaId = this.temas.at(index).get('_id')?.value;

    if (temaId) {
      this.alertaService.showConfirmAlert('¿Eliminar este tema y todos sus subtemas?')
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

  eliminarSubtema(temaIndex: number, subtemaIndex: number): void {
    const subtemaId = this.getSubtemas(temaIndex).at(subtemaIndex).get('_id')?.value;

    if (subtemaId) {
      this.alertaService.showConfirmAlert('¿Eliminar este subtema?')
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

  async guardarAspectos(): Promise<boolean> {
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

      if (!temaId) {
        let descripcion = temaForm.descripcion_titulo;
        try {
          if (this.contieneImagen(descripcion)) {
            descripcion = await this.subirHtmlTemaANuxeo(descripcion, i);
          }
        } catch (error) {
          console.error('Error al subir la descripción del tema al gestor documental:', error);
          fallos.push(`Tema "${temaForm.nombre}": no se pudo guardar la imagen de la descripción en el gestor documental. No se creó el tema ni sus subtemas.`);
          continue;
        }
        try {
          const response: any = await firstValueFrom(this.planAnualAuditoriaService.post('tema', {
            informe_id: this.informeId,
            titulo: temaForm.nombre,
            descripcion_titulo: descripcion
          }));
          temaId = response?.Data?._id || response?._id || response?.Id;
          this.temas.at(i).patchValue({ _id: temaId, isNew: false });
        } catch (error) {
          console.error('Error al crear tema:', error);
          fallos.push(`Tema "${temaForm.nombre}": no se pudo crear en la base de datos. Tampoco se guardaron sus subtemas.`);
          continue;
        }
      } else {
        let descripcion = temaForm.descripcion_titulo;
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
            descripcion = await this.subirHtmlTemaANuxeo(htmlGuardado, i);
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

      for (let j = 0; j < temaForm.subtemas.length; j++) {
        const subtemaForm = temaForm.subtemas[j];
        let subtemaId = subtemaForm._id;

        if (!subtemaId) {
          try {
            const response: any = await firstValueFrom(this.planAnualAuditoriaService.post('subtema', {
              tema_id: temaId,
              titulo: subtemaForm.nombre
            }));
            const subtemasEnResponse = response?.Data?.subtema ?? [];
            subtemaId = subtemasEnResponse[subtemasEnResponse.length - 1]?._id;
            this.getSubtemas(i).at(j).patchValue({ _id: subtemaId, isNew: false });
          } catch (error) {
            console.error('Error al crear subtema:', error);
            fallos.push(`Subtema "${subtemaForm.nombre}": no se pudo crear en la base de datos.`);
          }
        } else {
          try {
            await firstValueFrom(this.planAnualAuditoriaService.put(`subtema/${subtemaId}`, {
              titulo: subtemaForm.nombre
            }));
          } catch (error) {
            console.error('Error al actualizar subtema:', error);
            fallos.push(`Subtema "${subtemaForm.nombre}": no se pudo actualizar en la base de datos.`);
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

  // Sube el HTML del tema (con imágenes) a Nuxeo y devuelve el valor a guardar en descripcion_titulo
  private async subirHtmlTemaANuxeo(htmlOriginal: string, indice: number): Promise<string> {
    let html = String(htmlOriginal);
    html = html.replace(/width="(\d+)px"/g, 'style="width:$1px;"');
    html = html.replace(/\sheight="auto"/g, '');

    const blob = new Blob([html], { type: 'text/html' });
    const htmlFile = new File([blob], 'archivo.html', { type: 'text/html' });
    const base64 = await this.nuxeoService.fileABase64(htmlFile) as string;

    const payload = {
      IdTipoDocumento: environment.TIPO_DOCUMENTO.INFORMES,
      nombre: `Tema ${indice + 1} de informe ${this.informeId}.html`,
      descripcion: 'Documento HTML (Aspectos Evaluados) de un tema de seguimiento',
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
}
