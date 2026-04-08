import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { MenuComSubMenus, SubMenu } from '../models/menu.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Menu`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  /** Estrutura de menus com submenus — fonte de verdade para o sidenav */
  readonly menuSignal = signal<MenuComSubMenus[]>([]);

  constructor() {
    this.authService.loggedOut$.subscribe(() => {
      this.menuSignal.set([]);
    });
  }

  /** Inicializa a partir do localStorage; se vazio, busca da API */
  async initialize(): Promise<void> {
    const cached = this.authService.getMenuData();
    if (cached.length > 0) {
      this.menuSignal.set(cached);
      return;
    }
    await this.loadFromApi();
  }

  /** Busca GET /api/Menu (retorna MenuComSubMenus[]) e salva */
  async loadFromApi(): Promise<void> {
    try {
      const menus = await firstValueFrom(
        this.http.get<MenuComSubMenus[]>(this.apiUrl).pipe(
          catchError(() => of([] as MenuComSubMenus[]))
        )
      );
      this.menuSignal.set(menus);
      this.authService.saveMenuData(menus);
    } catch {
      this.menuSignal.set([]);
    }
  }

  /** Retorna todos os submenus (flat) — usado pelo user-permissions */
  getSubMenus(): Observable<SubMenu[]> {
    return this.http.get<SubMenu[]>(`${this.apiUrl}/submenus`).pipe(
      catchError(() => of([] as SubMenu[]))
    );
  }
}
