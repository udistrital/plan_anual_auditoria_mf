 
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { environment } from 'src/environments/environment';
 
@Injectable({
    providedIn: 'root',
})
 
export class ImplicitAutenticationService {
    logoutUrl: any;
    params: any;
    payload: any;
    timeActiveAlert: number = 4000;
    isLogin = false;
  
    rolesConsulta = environment.ROLES_CONSULTA;
    rolesEdicion = environment.ROLES_CONSULTA_EDICION;

    private userSubject = new BehaviorSubject({});
    public user$ = this.userSubject.asObservable();
 
    private menuSubject = new BehaviorSubject({});
    public menu$ = this.menuSubject.asObservable();
 
    private logoutSubject = new BehaviorSubject('');
    public logout$ = this.logoutSubject.asObservable();
 
    constructor(){
        const user:any = localStorage.getItem('user');
        this.userSubject.next(JSON.parse(atob(user)));
    }
 
    public getPayload(): any {
        const idToken = window.localStorage.getItem('id_token')?.split('.');
        const payload = idToken!=undefined?JSON.parse(atob(idToken[1])):null;
        return payload;
    }
 
    public getRole() {
        const rolePromise = new Promise((resolve, reject) => {
            this.user$.subscribe((data: any) => {
                const { user, userService } = data;
                const roleUser = typeof user.role !== 'undefined' ? user.role : [];
                const roleUserService = typeof userService.role !== 'undefined' ? userService.role : [];
                const roles = (roleUser.concat(roleUserService)).filter((data: any) => (data.indexOf('/') === -1));
                resolve(roles);
            });
        });
        return rolePromise;
    }
 
    public getMail() {
        const rolePromise = new Promise((resolve, reject) => {
            this.user$.subscribe((data: any) => {
                const { userService } = data;
                resolve(userService.email);
            });
        });
        return rolePromise;
    }
 
    public getDocument() {
        const rolePromise = new Promise((resolve, reject) => {
            this.user$.subscribe((data: any) => {
                const { userService } = data;
                resolve(userService.documento);
            });
        });
        return rolePromise;
    }

    public PermisoEdicion(roles: string[]): boolean {
        return roles.some(rol =>this.rolesEdicion.includes(rol));
      }
    
      public PermisoConsulta(roles: string[]): boolean {
        return roles.some(rol =>this.rolesConsulta.includes(rol));
      }
}