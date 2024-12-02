import { Component, inject } from "@angular/core";
import { SpinnerService } from "src/app/shared/services/spinner.service";

@Component({
  selector: "app-spinner",
  templateUrl: "./spinner.component.html",
  styleUrl: "./spinner.component.css",
})
export class SpinnerComponent {
  private readonly spinnerSvc = inject(SpinnerService);
  isLoading = this.spinnerSvc.isLoading;
}
