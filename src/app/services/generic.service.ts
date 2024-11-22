import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class GenericService {
  constructor(private http: HttpClient) {}

  getSelectOptions(url: string): Observable<any[]> {
    return this.http.get<any[]>(url);
  }
}