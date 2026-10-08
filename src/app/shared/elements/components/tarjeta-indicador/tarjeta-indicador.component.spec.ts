import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { TarjetaIndicadorComponent } from './tarjeta-indicador.component';

describe('TarjetaIndicadorComponent', () => {
  let component: TarjetaIndicadorComponent;
  let fixture: ComponentFixture<TarjetaIndicadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TarjetaIndicadorComponent],
      imports: [MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaIndicadorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('muestra el valor y aplica la clase de la variante', () => {
    component.titulo = 'Planes aprobados';
    component.valor = 9;
    component.variante = 'exito';
    fixture.detectChanges();

    const elemento: HTMLElement = fixture.nativeElement;
    expect(elemento.querySelector('.valor')?.textContent).toContain('9');
    expect(elemento.querySelector('.tarjeta-indicador')?.classList).toContain('variante-exito');
  });
});
