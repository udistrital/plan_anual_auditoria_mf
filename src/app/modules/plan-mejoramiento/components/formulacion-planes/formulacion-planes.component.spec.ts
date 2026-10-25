import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RolService } from 'src/app/core/services/rol.service';
import { environment } from 'src/environments/environment';
import { FormulacionPlanesComponent } from './formulacion-planes.component';

describe('FormulacionPlanesComponent', () => {
  let component: FormulacionPlanesComponent;
  let fixture: ComponentFixture<FormulacionPlanesComponent>;
  let rolesUsuario: string[];

  const rolServiceMock = {
    cargarRoles: jest.fn().mockResolvedValue(undefined),
    getRolPrioritario: (prioridad: string[]) => prioridad.find((r) => rolesUsuario.includes(r)) ?? null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormulacionPlanesComponent],
      providers: [{ provide: RolService, useValue: rolServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FormulacionPlanesComponent);
    component = fixture.componentInstance;
  });

  it('muestra la vista del auditado para JEFE_DEPENDENCIA', async () => {
    rolesUsuario = [environment.ROL.JEFE_DEPENDENCIA];
    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.vista).toBe('auditado');
    expect(component.rol).toBe(environment.ROL.JEFE_DEPENDENCIA);
    expect(fixture.nativeElement.querySelector('app-formulacion-vista-auditado')).not.toBeNull();
  });

  it('muestra la vista del auditado para ASISTENTE_DEPENDENCIA', async () => {
    rolesUsuario = [environment.ROL.ASISTENTE_DEPENDENCIA];
    await component.ngOnInit();

    expect(component.vista).toBe('auditado');
  });

  it.each([
    environment.ROL.JEFE,
    environment.ROL.AUDITOR_EXPERTO,
    environment.ROL.AUDITOR,
    environment.ROL.AUDITOR_ASISTENTE,
  ])('muestra la vista del auditor para %s', async (rol) => {
    rolesUsuario = [rol];
    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.vista).toBe('auditor');
    expect(component.rol).toBe(rol);
    expect(fixture.nativeElement.querySelector('app-formulacion-vista-auditor')).not.toBeNull();
  });

  it('prioriza el rol de mayor jerarquía cuando el usuario tiene varios', async () => {
    rolesUsuario = [environment.ROL.AUDITOR, environment.ROL.AUDITOR_EXPERTO];
    await component.ngOnInit();

    expect(component.rol).toBe(environment.ROL.AUDITOR_EXPERTO);
  });

  it('deja la página en blanco para roles sin vista', async () => {
    rolesUsuario = [environment.ROL.ADMIN];
    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.vista).toBeNull();
    expect(fixture.nativeElement.querySelector('app-formulacion-vista-auditado')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-formulacion-vista-auditor')).toBeNull();
  });
});
