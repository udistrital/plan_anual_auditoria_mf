import {
  Component,
  forwardRef,
  Input,
  signal,
  effect,
  WritableSignal,
  OnDestroy,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
    selector: 'app-editor-enriquecido',
    templateUrl: './editor-enriquecido.component.html',
    styleUrls: ['./editor-enriquecido.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EditorEnriquecidoComponent),
            multi: true
        }
    ],
    standalone: false
})
export class EditorEnriquecidoComponent implements ControlValueAccessor, OnDestroy {
  @Input() placeholder: string = 'Escribe aquí...';
  // Habilita la inserción de imágenes en la barra de herramientas (issue #958).
  @Input() permitirImagenes: boolean = false;

  editorForm: FormGroup;
  private readonly valueSignal: WritableSignal<string> = signal('');
  private onTouchedCallback: () => void = () => { };
  private onChangeCallback: (value: string) => void = () => { };

  // Ancho máximo aplicado a las imágenes insertadas, igual que en aspectos-evaluados.
  private readonly ANCHO_MAX_IMG = 500;
  private observadores: MutationObserver[] = [];

  get editorModules(): Record<string, unknown> {
    const toolbar: unknown[] = [
      ['bold', 'italic', 'underline', 'strike'], // Botones de formato
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }], // Listas
      [{ header: [1, 2, 3, false] }], // Encabezados
      [{ color: [] }, { background: [] }], // Colores
    ];
    // La inserción de imágenes es opcional para no alterar los usos de solo texto.
    toolbar.push(this.permitirImagenes ? ['link', 'image'] : ['link']);
    toolbar.push(['clean']); // Eliminar formato

    const modulos: Record<string, unknown> = { toolbar };

    if (this.permitirImagenes) {
      modulos['blotFormatter'] = {
        align: { allowAligning: false },
        resize: { allowResizing: true },
        delete: { allowKeyboardDelete: true },
        image: {
          allowAltTitleEdit: false,
          allowCompressor: false,
          linkOptions: { allowLinkEdit: false },
        },
      };
    }
    return modulos;
  }

  constructor(private readonly fb: FormBuilder) {
    this.editorForm = this.fb.group({
      editorContent: [''],
    });

    // Propagar cambios en el contenido del editor al modelo del formulario
    effect(() => {
      const value = this.valueSignal();
      if (this.editorForm.get('editorContent')?.value !== value) {
        this.editorForm.patchValue(
          { editorContent: value },
          { emitEvent: false }
        );
      }
    });

    // Reaccionar a los cambios en el formulario
    this.editorForm.valueChanges.subscribe((value) => {
      if (value.editorContent !== undefined) {
        this.valueSignal.set(value.editorContent);
        this.onChangeCallback(value.editorContent);
      }
    });
  }

  ngOnDestroy(): void {
    this.observadores.forEach(o => o.disconnect());
    this.observadores = [];
  }

  // Limita el ancho de las imágenes insertadas usando solo un MutationObserver (sin listeners
  // globales de mouse, que provocaban errores de getComputedStyle con blotFormatter).
  onEditorCreated(quill: any): void {
    if (!this.permitirImagenes) return;

    const root: HTMLElement = quill.root;

    const limitar = (img: HTMLImageElement) => {
      const aplicar = () => {
        const explicito = parseInt(img.getAttribute('width') || img.style.width || '', 10);
        const ancho = explicito > 0 ? explicito : img.naturalWidth;
        if (ancho > this.ANCHO_MAX_IMG) {
          img.style.removeProperty('width');
          img.setAttribute('width', `${this.ANCHO_MAX_IMG}px`);
        }
      };

      if (img.complete && img.naturalWidth > 0) {
        aplicar();
      } else {
        img.addEventListener('load', aplicar, { once: true });
      }
    };

    root.querySelectorAll('img').forEach(limitar);

    const observador = new MutationObserver((mutaciones) => {
      for (const m of mutaciones) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => {
            if (n instanceof HTMLImageElement) limitar(n);
            else if (n instanceof HTMLElement) n.querySelectorAll('img').forEach(limitar);
          });
        }
      }
    });
    observador.observe(root, { subtree: true, childList: true });
    this.observadores.push(observador);
  }

  writeValue(value: string): void {
    this.valueSignal.set(value ?? '');
  }

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.editorForm.disable();
    } else {
      this.editorForm.enable();
    }
  }
}
