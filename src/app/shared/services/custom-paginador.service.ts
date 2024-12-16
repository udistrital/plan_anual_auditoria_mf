import { MatPaginatorIntl } from "@angular/material/paginator";

export class CustomPaginadorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = "Elementos por página:";

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return `${startIndex + 1} - ${endIndex} de ${length}`;
  };
}
