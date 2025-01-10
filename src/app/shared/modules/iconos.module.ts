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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" stroke-width="1.5"> 
            <path d="M14 3v4a1 1 0 0 0 1 1h4"></path> 
            <path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"></path> 
            <path d="M4 15l4 6"></path> <path d="M4 21l4 -6"></path> 
            <path d="M17 20.25c0 .414 .336 .75 .75 .75h1.25a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-1a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h1.25a.75 .75 0 0 1 .75 .75"></path> 
            <path d="M11 15v6h3"></path> 
        </svg> 
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" stroke-width="1.75"> 
            <path d="M14 3v4a1 1 0 0 0 1 1h4"></path> 
            <path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"></path> 
            <path d="M4 15l4 6"></path> <path d="M4 21l4 -6"></path> 
            <path d="M17 20.25c0 .414 .336 .75 .75 .75h1.25a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-1a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h1.25a.75 .75 0 0 1 .75 .75"></path> 
            <path d="M11 15v6h3"></path> 
        </svg>  
      `)
    );
  }
}