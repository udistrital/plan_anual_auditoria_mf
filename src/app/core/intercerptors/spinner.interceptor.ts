import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize } from "rxjs";
import { SpinnerService } from "src/app/shared/services/spinner.service";

export const SpinnerInterceptor: HttpInterceptorFn = (req, next) => {
  const spinnerSvc = inject(SpinnerService);
  spinnerSvc.show(); // Incrementa el contador y muestra el spinner

  return next(req).pipe(finalize(() => spinnerSvc.hide())); // Decrementa el contador y oculta si es necesario
};
