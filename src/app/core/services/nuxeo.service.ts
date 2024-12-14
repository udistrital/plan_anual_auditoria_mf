import { Injectable } from "@angular/core";
import { RequestManager } from "../managers/requestManager";
import { GestorDocumentalService } from "./gestor-documental.service";
import { Subject } from 'rxjs';
import { Documento } from "src/app/shared/data/models/documento/documento";
import { lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';


@Injectable({
  providedIn: "root",
})

export class NuxeoService {

    constructor(
        private gestorDocumentalService: GestorDocumentalService,
    ) {}

    obtenerUrlFile(base64:any, minetype:any) {
        return new Promise<string>((resolve, reject) => {
            const url = `data:${minetype};base64,${base64}`;
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "File name", { type: minetype })
                    const url = URL.createObjectURL(file);
                    resolve(url);
                })
        });
    }

    fileABase64(file:any) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                let encoded = reader.result!.toString().replace(/^data:(.*,)?/, '');
                if ((encoded.length % 4) > 0) {
                    encoded += '='.repeat(4 - (encoded.length % 4));
                }
                resolve(encoded);
            };
            reader.onerror = error => reject(error);
        });
    }

    guardarArchivos(files: any) {
        const documentsSubject = new Subject<Documento[]>();
        const documents$ = documentsSubject.asObservable();
    
        const documentos: any[] = [];
    
        files.map(async (file: any) => {
            let fileData: any;
            
            // Detectar si el archivo ya está en formato Base64
            if (typeof file.file === 'string') {
                fileData = file.file; // Ya es Base64
            } else if (file.file instanceof File) {
                fileData = await this.fileABase64(file.file); // Convertir a Base64
            } else {
                throw new Error("Formato de archivo no soportado");
            }
    
            const sendFileData = [{
                IdTipoDocumento: file.IdTipoDocumento,
                nombre: file.nombre.replace(/[\.]/g),
                metadatos: file.metadatos ? file.metadatos : {},
                descripcion: file.descripcion ? file.descripcion : "",
                file: fileData
            }];
    
            this.gestorDocumentalService.postAny('document/uploadAnyFormat', sendFileData)
                .subscribe((dataResponse) => {
                    documentos.push(dataResponse);
                    if (documentos.length === files.length) {
                        documentsSubject.next(documentos);
                    }
                });
        });
    
        return documents$;
    }

    async getByUUID(uuid: string): Promise<string> {
        try {
          const response = await lastValueFrom(
            this.gestorDocumentalService.get(`document/${uuid}`).pipe(
              map((response) => {
                if (!response?.file) {
                  throw new Error('El campo "file" no se encontró en la respuesta.');
                }
                return response.file;
              }),
              catchError((error) => {
                console.error(`Error al obtener el documento con UUID ${uuid}:`, error);
                throw new Error('No se pudo obtener el archivo desde el servidor.');
              })
            )
          );
          return response; // Devuelve el archivo en Base64
        } catch (error) {
          console.error('Error en getByUUID:', error);
          throw error; 
        }
      }
      
}