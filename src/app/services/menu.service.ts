import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { SubMenu } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Menu`;
  private readonly http = inject(HttpClient);

  /** Retorna todos os submenus — cada item tem `codigo` = codigoSubMenu de permissão */
  getSubMenus(): Observable<SubMenu[]> {
    return this.http.get<SubMenu[]>(`${this.apiUrl}/submenus`).pipe(
      catchError(() => of([] as SubMenu[]))
    );
  }
}
