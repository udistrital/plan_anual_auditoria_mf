import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

interface MensajeForo {
  autor: string;
  rol: string;
  fecha: Date;
  texto: string;
}

/**
 * Foro de seguimiento de la acción con DATOS DE EJEMPLO.
 * La colección del foro aún no existe en el backend (sisifo_documentacion#746 y #898, G-08):
 * los mensajes son fijos y el nuevo mensaje solo se agrega en memoria, sin guardarse.
 * Reemplazar MENSAJES_EJEMPLO y enviar() cuando se implemente el foro.
 */
const MENSAJES_EJEMPLO: MensajeForo[] = [
  {
    autor: 'Auditor de Control Interno',
    rol: 'Auditor',
    fecha: new Date(2026, 2, 18, 10, 15),
    texto: 'Pendiente remitir el anexo de firmas de las actas para validar el avance reportado.',
  },
  {
    autor: 'Asistente de la dependencia',
    rol: 'Asistente de dependencia',
    fecha: new Date(2026, 2, 19, 8, 40),
    texto: 'Se solicitaron las firmas; se cargarán en el próximo corte.',
  },
];

@Component({
  selector: 'app-panel-foro-accion',
  templateUrl: './panel-foro-accion.component.html',
  styleUrls: ['../panel-lateral.css', './panel-foro-accion.component.css'],
  standalone: false,
})
export class PanelForoAccionComponent {
  mensajes: MensajeForo[] = [...MENSAJES_EJEMPLO];
  nuevoMensaje = '';

  constructor(@Inject(MAT_DIALOG_DATA) readonly datos: { esAuditor: boolean }) {}

  iniciales(nombre: string): string {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }

  enviar() {
    const texto = this.nuevoMensaje.trim();
    if (!texto) return;
    this.mensajes = [
      ...this.mensajes,
      { autor: 'Usted', rol: this.datos.esAuditor ? 'Auditor' : 'Dependencia', fecha: new Date(), texto },
    ];
    this.nuevoMensaje = '';
  }
}
