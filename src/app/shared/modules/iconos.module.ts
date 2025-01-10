import { NgModule } from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
 
@NgModule({})
export class IconosModule {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.matIconRegistry.addSvgIconLiteral(
      "excel",
      this.domSanitizer.bypassSecurityTrustHtml(`
        <svg>
        </svg>
      `)
    );
  }
}