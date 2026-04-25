import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';

@Component({
  selector: 'app-registrar-plan',
  templateUrl: './registrar-plan.component.html',
  styleUrls: ['./registrar-plan.component.css'],
})
export class RegistrarPlanComponent implements OnInit {
  auditoriaId!: string;
  auditoria: any = null;
  cargando = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
  ) {}

  ngOnInit(): void {
    this.auditoriaId = this.route.snapshot.paramMap.get('id')!;
    this.cargarAuditoria();
  }

  cargarAuditoria(): void {
    this.planAuditoriaMid.get(`auditoria/${this.auditoriaId}`).subscribe({
      next: (res) => {
        this.auditoria = res.Data;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  regresar(): void {
    this.router.navigate(['/planes/plan-mejoramiento']);
  }
}