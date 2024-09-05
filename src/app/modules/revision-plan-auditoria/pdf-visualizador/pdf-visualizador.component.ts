import { Component, Input  } from '@angular/core';

@Component({
  selector: 'app-pdf-visualizador',
  templateUrl: './pdf-visualizador.component.html',
  styleUrls: ['./pdf-visualizador.component.css']
})
export class PdfVisualizadorComponent {
  @Input() base64Document: string = '';
  DocumentoData: string = '';
  DocumentoLoad: boolean = false;

  ngOnInit(): void {
    if (this.base64Document && document) {
      console.log(this.base64Document)
      this.DocumentoData = 'data:application/pdf;base64,' + this.base64Document;
      this.DocumentoLoad = true;
      console.log(this.DocumentoLoad)
    } else {
      this.DocumentoLoad = false;
      console.log(this.DocumentoLoad)

    }
  }
}
