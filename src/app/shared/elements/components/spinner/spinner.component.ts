import { Component, inject } from "@angular/core";
import { SpinnerService } from "src/app/shared/services/spinner.service";

@Component({
  selector: "app-spinner",
  template: `<div *ngIf="isLoading | async" class="backdrop">
    <span class="loader"></span>
  </div> `,
  styleUrl: "./spinner.component.css",
})
export class SpinnerComponent {
  private readonly spinnerSvc = inject(SpinnerService);
  isLoading = this.spinnerSvc.isLoading;
}
