import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  signal,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { OikosService } from "src/app/core/services/oikos.service";
import { AutenticacionMidService } from "src/app/core/services/autenticacion-mid.service";
import { TercerosCrudService } from "src/app/core/services/terceros-crud.service";
import { AlertService } from "src/app/shared/services/alert.service";

/** Dependencia seleccionable (OIKOS). */
interface OpcionDependencia {
  id: number;
  nombre: string;
}

@Component({
  selector: "app-asignar-ejecutor",
  templateUrl: "./asignar-ejecutor.component.html",
  styleUrls: ["./asignar-ejecutor.component.scss"],
  standalone: false,
})
export class AsignarEjecutorComponent implements OnInit {
  @ViewChild("documentoInput") documentoInput!: ElementRef<HTMLInputElement>;
  @ViewChild("emailInput") emailInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  guardando = false;

  /** Dependencia preseleccionada (si se llegó desde una fila del listado). */
  dependenciaNombre = "";
  dependenciaPreseleccionada = false;

  cargandoDependencias = signal<boolean>(false);
  buscando = signal<boolean>(false);

  dependencias: OpcionDependencia[] = [];
  dependenciasFiltradas: OpcionDependencia[] = [];

  /** Datos del usuario encontrado por documento o correo. */
  usuarioEncontrado: {
    usuario_id: number;
    nombre: string;
    correo: string;
  } | null = null;

  /** Correo resuelto del usuario (para asignar el rol en WSO2). */
  private correoUsuario = "";

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planService: PlanAnualAuditoriaService,
    private readonly oikosService: OikosService,
    private readonly autenticacionService: AutenticacionMidService,
    private readonly tercerosService: TercerosCrudService,
    private readonly alertaService: AlertService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const dependenciaId = params["dependencia_id"]
      ? Number(params["dependencia_id"])
      : "";
    this.dependenciaNombre = params["dependencia_nombre"] ?? "";
    this.dependenciaPreseleccionada = !!dependenciaId;

    this.form = this.fb.group({
      dependencia_id: [
        { value: dependenciaId, disabled: this.dependenciaPreseleccionada },
        [Validators.required],
      ],
    });

    this.cargarDependencias();
  }

  get tituloDependencia(): string {
    return this.dependenciaNombre ? this.dependenciaNombre : "Nueva asignación";
  }

  // ── Dependencias (OIKOS) ──────────────────────────────────

  private cargarDependencias(): void {
    this.cargandoDependencias.set(true);
    this.oikosService.get("dependencia?query=activo:true&limit=0").subscribe({
      next: (resp: any) => {
        const data: any[] = resp?.Data ?? resp ?? [];
        this.dependencias = data
          .filter((d) => d?.Id != null)
          .map((d) => ({ id: Number(d.Id), nombre: d.Nombre }));
        this.dependenciasFiltradas = [...this.dependencias];
        this.cargandoDependencias.set(false);
      },
      error: () => {
        this.cargandoDependencias.set(false);
        this.alertaService.showErrorAlert(
          "No se pudieron cargar las dependencias. Inténtalo nuevamente."
        );
      },
    });
  }

  filtrarDependencias(termino: string): void {
    const t = (termino ?? "").toLowerCase().trim();
    this.dependenciasFiltradas = !t
      ? [...this.dependencias]
      : this.dependencias.filter(
          (d) => d.nombre.toLowerCase().includes(t) || String(d.id).includes(t)
        );
  }

  // ── Búsqueda del usuario (misma lógica que registrar-usuario) ──

  /**
   * Busca por documento exacto: valida con token/documentoToken. Solo si hay
   * coincidencia (documento devuelto) carga el correo en su caja y busca el
   * nombre del tercero. Mismo flujo que registrar-usuario.
   */
  buscarPorDocumento(documento: string): void {
    const doc = (documento ?? "").trim();
    if (!doc) {
      this.alertaService.showAlert(
        "Atención",
        "Por favor, ingresa un documento válido."
      );
      return;
    }
    this.usuarioEncontrado = null;
    this.buscando.set(true);

    this.autenticacionService
      .getDocumento("token/documentoToken", doc)
      .subscribe({
        next: (data: any) => {
          if (data?.documento) {
            // Coincidencia exacta: carga el correo y resuelve el nombre.
            this.correoUsuario = data.email ?? "";
            if (this.emailInput) {
              this.emailInput.nativeElement.value = this.correoUsuario;
            }
            this.buscarTercero(String(data.documento));
          } else {
            this.buscando.set(false);
            this.alertaService.showAlert(
              "Sin resultados",
              "No se encontraron datos del documento proporcionado."
            );
          }
        },
        error: () => {
          this.buscando.set(false);
          this.alertaService.showErrorAlert(
            "No se encontraron datos del usuario ingresado."
          );
        },
      });
  }

  /**
   * Busca por correo exacto: valida con token/userRol. Solo si hay coincidencia
   * (documento devuelto) carga el documento en su caja y busca el nombre del
   * tercero. Mismo flujo que registrar-usuario.
   */
  buscarPorCorreo(correo: string): void {
    const mail = (correo ?? "").trim();
    if (!mail) {
      this.alertaService.showAlert(
        "Atención",
        "Por favor, ingresa un correo válido."
      );
      return;
    }
    this.usuarioEncontrado = null;
    this.buscando.set(true);

    this.autenticacionService.getEmail("token/userRol", mail).subscribe({
      next: (data: any) => {
        if (data?.documento) {
          // Coincidencia exacta: carga el documento y resuelve el nombre.
          this.correoUsuario = mail;
          if (this.documentoInput) {
            this.documentoInput.nativeElement.value = String(data.documento);
          }
          this.buscarTercero(String(data.documento));
        } else {
          this.buscando.set(false);
          this.alertaService.showAlert(
            "Sin resultados",
            "No se encontraron datos asociados al correo proporcionado."
          );
        }
      },
      error: () => {
        this.buscando.set(false);
        this.alertaService.showErrorAlert(
          "Error al buscar el correo. Verifica los datos e inténtalo nuevamente."
        );
      },
    });
  }

  /** Consulta terceros/identificacion y arma el usuario encontrado. */
  private buscarTercero(documento: string): void {
    this.tercerosService
      .get(`tercero/identificacion?query=${documento}`)
      .subscribe({
        next: (data: any) => {
          const registro = Array.isArray(data) ? data[0] : data;
          const tercero = registro?.Tercero ?? registro;
          const nombre = tercero?.NombreCompleto;
          const terceroId = tercero?.Id ?? registro?.TerceroId;

          if (nombre && terceroId != null) {
            this.usuarioEncontrado = {
              usuario_id: Number(terceroId),
              nombre,
              correo: this.correoUsuario,
            };
          } else {
            this.alertaService.showAlert(
              "Sin resultados",
              "No se encontraron datos del usuario con el documento proporcionado."
            );
          }
          this.buscando.set(false);
        },
        error: () => {
          this.buscando.set(false);
          this.alertaService.showErrorAlert(
            "No se encontraron datos del usuario ingresado."
          );
        },
      });
  }

  // ── Guardado ──────────────────────────────────────────────

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.usuarioEncontrado) {
      this.alertaService.showAlert(
        "Atención",
        "Primero busca al usuario por documento o correo."
      );
      return;
    }

    this.guardando = true;
    const body = {
      dependencia_id: Number(this.form.getRawValue().dependencia_id),
      usuario_id: this.usuarioEncontrado.usuario_id,
      usuario_rol: "ejecutor",
      actual: true,
      activo: true,
      fecha_asignacion: new Date().toISOString(),
    };

    const nombre = this.usuarioEncontrado.nombre;
    const correo = this.usuarioEncontrado.correo;

    this.planService.post("ejecutor-dependencia", body).subscribe({
      next: () => {
        // Tras crear el registro, se agrega el rol EJECUTOR_AUDITADO en WSO2.
        this.agregarRolEjecutor(correo, nombre);
      },
      error: (err: any) => {
        this.guardando = false;
        const mensaje =
          err?.error?.Data ??
          "No se pudo asignar el ejecutor. Verifica los datos e inténtalo nuevamente.";
        this.alertaService.showErrorAlert(mensaje);
      },
    });
  }

  /**
   * Agrega el rol EJECUTOR_AUDITADO al usuario en WSO2 (rol/add). Si el rol ya
   * estaba asignado, se trata como éxito (mismo criterio que registrar-usuario).
   */
  private agregarRolEjecutor(correo: string, nombre: string): void {
    if (!correo) {
      // Sin correo no se puede asignar el rol; el registro ya quedó creado.
      this.guardando = false;
      this.alertaService.showSuccessAlert(
        `${nombre} fue asignado como ejecutor.`,
        "Asignación exitosa"
      );
      this.volver();
      return;
    }

    this.autenticacionService
      .postRol("rol/add", "EJECUTOR_AUDITADO", correo)
      .subscribe({
        next: () => {
          this.guardando = false;
          this.alertaService.showSuccessAlert(
            `${nombre} fue asignado como ejecutor.`,
            "Asignación exitosa"
          );
          this.volver();
        },
        error: (err: any) => {
          this.guardando = false;
          const mensaje = (
            err?.error?.Message ??
            err?.error?.message ??
            err?.message ??
            ""
          )
            .toString()
            .toLowerCase();
          const yaExiste =
            mensaje.includes("ya está asignado") ||
            mensaje.includes("ya esta asignado") ||
            (mensaje.includes("role") &&
              (mensaje.includes("exists") || mensaje.includes("already")));

          if (yaExiste) {
            this.alertaService.showSuccessAlert(
              `${nombre} fue asignado como ejecutor.`,
              "Asignación exitosa"
            );
            this.volver();
          } else {
            this.alertaService.showErrorAlert(
              "El ejecutor fue registrado, pero no se pudo asignar el rol EJECUTOR_AUDITADO."
            );
          }
        },
      });
  }

  /** Regresa al listado de ejecutores por dependencia. */
  volver(): void {
    this.router.navigate(["/plan-mejoramiento/ejecutor-dependencia"]);
  }
}
