import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "unirConComa",
  standalone: true,
})
export class UnirConComaPipe implements PipeTransform {
  transform(value: any[]): string {
    return Array.isArray(value) ? value.join("YYY ") : "Sin data";
  }
}
