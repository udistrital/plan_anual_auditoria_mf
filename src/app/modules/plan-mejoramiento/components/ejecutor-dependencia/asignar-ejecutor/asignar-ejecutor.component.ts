import { Component, OnInit, signal } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { OikosService } from "src/app/core/services/oikos.service";
import { AutenticacionMidService } from "src/app/core/services/autenticacion-mid.service";
import { AlertService } from "src/app/shared/services/alert.service";

/** Dependencia seleccionable (OIKOS). */
interface OpcionDependencia {
  id: number;
  nombre: string;
}

/** Persona con rol seleccionable como ejecutor (autenticacion_mid rol/periods). */
interface OpcionEjecutor {
  usuario_id: number;
  nombre: string;
  documento: string;
  rol_usuario: string;
}

@Component({
  selector: "app-asignar-ejecutor",
  templateUrl: "./asignar-ejecutor.component.html",
  styleUrls: ["./asignar-ejecutor.component.scss"],
  standalone: false,
})
export class AsignarEjecutorComponent implements OnInit {
  form!: FormGroup;
  guardando = false;

  /** Dependencia preseleccionada (si se llegó desde una fila del listado). */
  dependenciaNombre = "";
  dependenciaPreseleccionada = false;

  cargandoDependencias = signal<boolean>(false);
  cargandoEjecutores = signal<boolean>(false);

  dependencias: OpcionDependencia[] = [];
  ejecutores: OpcionEjecutor[] = [];

  /** Listas filtradas por el texto de búsqueda de cada selector. */
  dependenciasFiltradas: OpcionDependencia[] = [];
  ejecutoresFiltrados: OpcionEjecutor[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planService: PlanAnualAuditoriaService,
    private readonly oikosService: OikosService,
    private readonly autenticacionService: AutenticacionMidService,
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
      usuario_id: ["", [Validators.required]],
    });

    this.cargarDependencias();
    this.cargarEjecutores();
  }

  get tituloDependencia(): string {
    return this.dependenciaNombre ? this.dependenciaNombre : "Nueva asignación";
  }

  // ── Carga de catálogos ────────────────────────────────────

  /** Dependencias activas desde OIKOS. */
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

  /** Personas con rol vigente (candidatas a ejecutor) desde autenticacion_mid. */
  private cargarEjecutores(): void {
    this.cargandoEjecutores.set(true);
    this.autenticacionService.get("rol/periods").subscribe({
      next: (resp: any) => {
        const data: any[] = resp?.Data ?? resp ?? [];
        // Deduplica por tercero (una persona puede tener varios periodos/roles).
        const porTercero = new Map<number, OpcionEjecutor>();
        for (const r of data) {
          const usuarioId = Number(r?.id_tercero);
          if (!usuarioId || porTercero.has(usuarioId)) continue;
          porTercero.set(usuarioId, {
            usuario_id: usuarioId,
            nombre: r.nombre,
            documento: r.documento,
            rol_usuario: r.rol_usuario,
          });
        }
        this.ejecutores = [...porTercero.values()].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
        this.ejecutoresFiltrados = [...this.ejecutores];
        this.cargandoEjecutores.set(false);
      },
      error: () => {
        this.cargandoEjecutores.set(false);
        this.alertaService.showErrorAlert(
          "No se pudieron cargar las personas candidatas. Inténtalo nuevamente."
        );
      },
    });
  }

  // ── Filtros de los selectores ─────────────────────────────

  filtrarDependencias(termino: string): void {
    const t = (termino ?? "").toLowerCase().trim();
    this.dependenciasFiltradas = !t
      ? [...this.dependencias]
      : this.dependencias.filter(
          (d) =>
            d.nombre.toLowerCase().includes(t) || String(d.id).includes(t)
        );
  }

  filtrarEjecutores(termino: string): void {
    const t = (termino ?? "").toLowerCase().trim();
    this.ejecutoresFiltrados = !t
      ? [...this.ejecutores]
      : this.ejecutores.filter(
          (e) =>
            e.nombre.toLowerCase().includes(t) ||
            (e.documento ?? "").includes(t)
        );
  }

  // ── Guardado ──────────────────────────────────────────────

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const body = {
      dependencia_id: Number(this.form.getRawValue().dependencia_id),
      usuario_id: Number(this.form.get("usuario_id")?.value),
      usuario_rol: "ejecutor",
      actual: true,
      activo: true,
      fecha_asignacion: new Date().toISOString(),
    };

    this.planService.post("ejecutor-dependencia", body).subscribe({
      next: () => {
        this.guardando = false;
        this.alertaService.showSuccessAlert(
          "El ejecutor fue asignado correctamente.",
          "Asignación exitosa"
        );
        this.volver();
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

  /** Regresa al listado de ejecutores por dependencia. */
  volver(): void {
    this.router.navigate(["/plan-mejoramiento/ejecutor-dependencia"]);
  }
}
