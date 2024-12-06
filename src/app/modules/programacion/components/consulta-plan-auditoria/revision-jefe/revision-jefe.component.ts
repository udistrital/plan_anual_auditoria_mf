import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ModalMotivosRechazoComponent } from "./modal-motivos-rechazo/modal-motivos-rechazo.component";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { GestorDocumentalService } from "src/app/core/services/gestor-documental.service";

import {ActivatedRoute, Router } from "@angular/router";
import { lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
@Component({
  selector: "app-revision-jefe",
  templateUrl: "./revision-jefe.component.html",
  styleUrls: ["./revision-jefe.component.css"],
})
export class RevisionJefeComponent implements OnInit {
  selectedTab: number = 0;
  botonSeleccionado: string = "formato";
  documento: string = "";
  usuarioId: any;
  idPlanAuditoria: string = "";
  constructor(
    public dialog: MatDialog,
    private alertService: AlertService,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private gestorDocumentalService: GestorDocumentalService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,

  ) {}

  async ngOnInit() {
    // Asigna el Base64 a la variable, incluyendo el prefijo del tipo de archivo.
    this.route.queryParams.subscribe((params) => {
      this.idPlanAuditoria = params['id']; // Aquí obtienes el ID enviado
    });
    try{
      this.documento = await this.renderDocumento();
      
    }catch(error){
      console.log("no se genero el base 64");
    }
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  openModalRechazo(): void {
    this.planAuditoriaService
      .get("estado?query=activo:true&limit=0")
      .subscribe((res) => {
        console.log("slkdjaslkdjkasl");
        console.log(res);
      });
    this.dialog.open(ModalMotivosRechazoComponent, {
      width: "50%",
      data: {
        usuarioId: this.usuarioId,
      },
    });
  }

  openModalEnviar(): void {
    this.alertService
      .showConfirmAlert(
        "¿Está seguro de enviar el Plan Anual de Auditoría? - PAA?"
      )
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.aprobarPlanAuditoria();
      });
  }

  aprobarPlanAuditoria() {
    const planEstado = this.construirObjetoPlanEstado();
    this.planAuditoriaService.post("estado", planEstado).subscribe((res) => {
      this.alertService.showSuccessAlert(
        "Plan aceptado, el plan fue enviado al jefe de oficina"
      );
    });
  }

  construirObjetoPlanEstado() {
    return {
      //todo: este id esta quemado
      plan_auditoria_id: "6734d09dec8e871919b3b5dd",
      usuario_id: this.usuarioId,
      observacion: "",
      estado_id: environment.PLAN_ESTADO.APROBADO_JEFE_ID,
    };
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/programacion/plan-auditoria`]);
  }
  
  async consultarNuxeo(id: string): Promise<string> {
    try {
      const response = await lastValueFrom(
        this.gestorDocumentalService.get(`document/${id}`).pipe(
          map((response: any) => {
  
            // Validar si el campo `file` está presente en la respuesta
            if (response && response.file) {
              return response.file; // Retorna el campo `file`
            } else {
              throw new Error('El campo "file" no se encontró en la respuesta.');
            }
          }),
          catchError((error) => {
            throw new Error('No se pudo obtener el file.');
          })
        )
      );
  
      return response; // Devuelve el campo `file`
    } catch (error) {
      console.error('Error en consultarNuxeo:', error);
      throw error; // Permitir el manejo del error en la llamada al método
    }
  }

  async consultarDocumento(): Promise<string> {
    try {
      const nuxeoId = await lastValueFrom(
        this.planAuditoriaService.get(`documento?query=referencia_id:${this.idPlanAuditoria}&fields=nuxeo_enlace`).pipe(
          map((response: any) => {
            if (response && response.Data && Array.isArray(response.Data) && response.Data.length > 0) {
              const firstItem = response.Data[0];
              if (firstItem.nuxeo_enlace) {
                return firstItem.nuxeo_enlace;
              }
            }
            throw new Error('El campo "nuxeo_enlace" no se encontró en la respuesta.');
          }),
          catchError((error) => {
            console.error('Error al consultar el documento:', error);
            throw new Error('No se pudo obtener el nuxeo_enlace.');
          })
        )
      );
      return nuxeoId;
    } catch (error) {
      console.error('Error en consultarDocumento:', error);
      throw error; // Permitir manejo del error en el lugar donde se llama este método
    }
  }
  async renderDocumento(): Promise<string> {
    console.log("secretario 1111");
    const enlace = await this.consultarDocumento();
    const base64 = await this.consultarNuxeo(enlace);
    return base64;
  }

}
/*
export function documento() {
  return "";
}*/
