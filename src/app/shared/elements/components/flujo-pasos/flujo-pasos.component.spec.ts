import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { FlujoPasosComponent } from './flujo-pasos.component';

describe('FlujoPasosComponent', () => {
  let component: FlujoPasosComponent;
  let fixture: ComponentFixture<FlujoPasosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlujoPasosComponent],
      imports: [MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FlujoPasosComponent);
    component = fixture.componentInstance;
  });

  it('renderiza un elemento por cada paso, numerado', () => {
    component.pasos = [
      { titulo: 'Formulación', descripcion: 'a' },
      { titulo: 'Revisión', descripcion: 'b' },
    ];
    fixture.detectChanges();

    const numeros = fixture.nativeElement.querySelectorAll('.numero');
    expect(numeros.length).toBe(2);
    expect(numeros[1].textContent).toContain('2');
  });

  it('oculta el encabezado cuando no recibe título', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.titulo')).toBeNull();

    component.titulo = 'Flujo';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.titulo')?.textContent).toContain('Flujo');
  });
});
