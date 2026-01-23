import {
  Component,
  forwardRef,
  Input,
  OnInit,
  signal,
  effect,
  WritableSignal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import { CommonModule } from '@angular/common';

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
})
export class EditorEnriquecidoComponent implements OnInit, ControlValueAccessor {
  @Input() placeholder: string = 'Escribe aquí...';

  editorForm: FormGroup;
  private valueSignal: WritableSignal<string> = signal('');
  private onTouchedCallback: () => void = () => { };
  private onChangeCallback: (value: string) => void = () => { };

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // Botones de formato
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }], // Listas
      [{ header: [1, 2, 3, false] }], // Encabezados
      [{ color: [] }, { background: [] }], // Colores
      ['link', 'image'], // Enlace e imágenes
      ['clean'], // Eliminar formato
    ],
  };

  constructor(private fb: FormBuilder) {
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

  ngOnInit(): void { }

  writeValue(value: string): void {
    this.valueSignal.set(value || '');
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
