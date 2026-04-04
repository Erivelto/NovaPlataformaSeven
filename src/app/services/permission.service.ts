import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { UsuarioPermissao } from './usuario-permissao.service';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpClient);
  private notify = inject(NotificationService);
  private authService = inject(AuthService);

  /** Permissões do usuário logado — fonte de verdade */
  readonly permissionsSignal = signal<UsuarioPermissao[]>([]);

  private _loadingPromise: Promise<void> | null = null;
  private _loadedForUserId: number | null = null;

  /** Observable wrapper para compatibilidade RxJS */
  readonly permissions$ = toObservable(this.permissionsSignal);

  /** true enquanto o primeiro carregamento está em andamento */
  readonly loading = signal(false);

  constructor() {
    this.authService.loggedOut$.subscribe(() => {
      this.permissionsSignal.set([]);
      this._loadedForUserId = null;
      this._loadingPromise = null;
    });
  }

  private get usuarioPermissaoUrl() {
    return `${environment.apiBaseUrl}/UsuarioPermissao`;
  }

  /** Carrega permissões do usuário logado */
  async initializeForCurrentUser(): Promise<void> {
    const user = this.authService.getUserData();
    if (!user?.id) return;
    if (this._loadingPromise) return this._loadingPromise;
    if (this._loadedForUserId === user.id && this.permissionsSignal().length > 0) return;

    this._loadingPromise = this.loadPermissionsForUser(user.id).finally(() => {
      this._loadedForUserId = user.id ?? null;
      this._loadingPromise = null;
    });
    return this._loadingPromise;
  }

  async loadPermissionsForUser(idUsuario: number): Promise<void> {
    this.loading.set(true);
    try {
      const url = `${this.usuarioPermissaoUrl}/usuario/${idUsuario}`;
      const result = await firstValueFrom(this.http.get<UsuarioPermissao[]>(url));
      this.permissionsSignal.set(result ?? []);
    } catch (err: any) {
      if (err?.status === 401) {
        this.authService.logout();
      } else {
        this.notify.error('Erro ao carregar permissões do usuário.');
      }
      this.permissionsSignal.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  refresh(): Promise<void> {
    return this.initializeForCurrentUser();
  }

  /**
   * Retorna true se o usuário tem permissão ativa para o codigoSubMenu.
   * Admins (tipo 'A') têm acesso a tudo.
   */
  hasPermission(codigoSubMenu: number | number[]): boolean {
    const user = this.authService.getUserData();
    if (user?.tipo === 'A') return true;

    const perms = this.permissionsSignal();
    if (!perms || perms.length === 0) return false;
    const codes = Array.isArray(codigoSubMenu) ? codigoSubMenu : [codigoSubMenu];
    return perms.some(p => p.ativo && codes.includes(p.codigoSubMenu));
  }

  hasPermissionSignal(codigoSubMenu: number | number[]) {
    return computed(() => this.hasPermission(codigoSubMenu));
  }
}
