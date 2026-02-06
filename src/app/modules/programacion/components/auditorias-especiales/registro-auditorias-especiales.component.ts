import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { RolService } from 'src/app/core/services/rol.service';
import { environment } from 'src/environments/environment';
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { TablaAuditoriasEspecialesComponent } from "./tabla-auditorias-especiales/tabla-auditorias-especiales.component";
import { UserService } from "src/app/core/services/user.service";

@Component({
  selector: "app-registro-auditorias-especiales",
  templateUrl: "./registro-auditorias-especiales.component.html",
  styleUrls: ["./registro-auditorias-especiales.component.css"],
})
export class RegistroAuditoriasEspecialesComponent implements OnInit {
  @ViewChild(TablaAuditoriasEspecialesComponent)
  tablaAuditoriasEspeciales!: TablaAuditoriasEspecialesComponent;

  permiso: boolean = false;
  vigencias: Parametro[] = [];
  vigenciaForm!: FormGroup;
  vigenciaSeleccionada: number | null = null;
  usuarioId: number | null = null;
  usuarioRol: string = ""

  constructor(
    private fb: FormBuilder,
    private alertaService: AlertService, 
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private parametrosService: ParametrosService,
    private userService: UserService,
    private rolService: RolService
  ) {}

  ngOnInit(): void {
    this.iniciarvigenciaForm();
    this.cargarVigencias();
    this.setPermisos();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
    this.usuarioRol = this.rolService.getRoles().filter(
      (role: string) => environment.ROLES_CREACION.PROGRAMACION.includes(role) && !role.includes("ADMIN")
    )[0];
  }

  setPermisos() {
    this.permiso = this.rolService.permisoCreacion(
      environment.ROLES_CREACION.PROGRAMACION
    );
  }

  cargarVigencias() {
    this.parametrosService
      .get("parametro?query=TipoParametroId:121&fields=Id,Nombre&limit=0&sortby=nombre&order=desc")
      .subscribe((res) => {
        if (res !== null) {
          this.vigencias = res.Data;
        }
      });
  }

  mostrarAuditoriasPorVigencia(vigencia: Vigencia) {
    this.vigenciaSeleccionada = vigencia.Id;
    this.tablaAuditoriasEspeciales.cargarAuditorias(vigencia.Id);
  }

  nuevaAuditoria() {
    if (this.vigenciaSeleccionada) {
      this.alertaService.showConfirmAlert(
        "¿Está seguro de crear una nueva auditoría especial para la vigencia seleccionada?"
      ).then((result) => {
        if (result.isConfirmed) {
          const auditoria = {
            vigencia_id: this.vigenciaSeleccionada,
            plan_auditoria_id: null,
          };
          const estado = {
            usuario_id: this.usuarioId!,
            usuario_rol: this.usuarioRol,
            fase_id: environment.AUDITORIA_FASE.PROGRAMACION,
            estado_id: environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID,
          };
          this.planAnualAuditoriaService.post("auditoria-gestion", {...auditoria, ...estado}).subscribe({
            next: (response: any) => {
              if (response.Status === 201) {
                this.alertaService.showSuccessAlert(
                  "Auditoría especial creada exitosamente"
                );
                this.tablaAuditoriasEspeciales.cargarAuditorias(auditoria.vigencia_id!);
              }
            },
            error: (error) => {
              if (
                error.error?.Data &&
                error.error.Data.includes("Ya existe una auditoría")
              ) {
                this.alertaService.showAlert(
                  "Vigencia duplicada",
                  "Ya existe una auditoría para la vigencia seleccionada."
                );
              } else {
                this.alertaService.showErrorAlert("Error al crear la auditoría");
              }
            }
          });
        }
      });
    } else {
      this.alertaService.showAlert(
        "Selección requerida",
        "Debe seleccionar un año."
      );
    }
  }

  iniciarvigenciaForm() {
    this.vigenciaForm = this.fb.group({
      vigencia: ["", Validators.required],
    });
  }
}
