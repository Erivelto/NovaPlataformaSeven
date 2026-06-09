import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { RoleService } from './role.service';
import { SupervisorService } from './supervisor.service';
import { StationService } from './station.service';
import { environment } from '../environments/environment';

export interface DiariaDisponivel {
  id?: number;
  quantidadeDiaria: number;
  dataReferencia: string;
  idFuncao?: number;
  idSupervisor?: number;
  idPosto?: number;
  usuarioCadAlt?: string;
  dataCadastro?: string;
  dataAlteracao?: string;
  excluido?: boolean;
  // Campos retornados pelo endpoint /lista
  funcao?: string;
  supervisor?: string;
  posto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiariaDisponivelService {
  private readonly apiUrl = `${environment.apiBaseUrl}/DiariaDisponivel`;
  private authService = inject(AuthService);
  private roleService = inject(RoleService);
  private supervisorService = inject(SupervisorService);
  private stationService = inject(StationService);

  constructor(private http: HttpClient) {}

  getAll(): Observable<DiariaDisponivel[]> {
    return this.http.get<DiariaDisponivel[]>(this.apiUrl);
  }

  /**
   * Lista enriquecida (função, supervisor, posto).
   * Montada no cliente: GET /DiariaDisponivel/lista retorna 500 na API Azure.
   */
  getLista(): Observable<DiariaDisponivel[]> {
    return this.buildListaFromAll();
  }

  private buildListaFromAll(): Observable<DiariaDisponivel[]> {
    return forkJoin({
      items: this.getAll().pipe(catchError(() => of([] as DiariaDisponivel[]))),
      roles: this.roleService.getAll().pipe(catchError(() => of([]))),
      supervisors: this.supervisorService.getAll().pipe(catchError(() => of([]))),
      stations: this.stationService.getAll().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ items, roles, supervisors, stations }) => {
        const roleById = new Map(roles.filter(r => r.id != null).map(r => [r.id!, r.nome]));
        const supervisorById = new Map(supervisors.filter(s => s.id != null).map(s => [s.id!, s.nome]));
        const stationById = new Map(stations.filter(s => s.id != null).map(s => [s.id!, s.nome]));

        return items.map(item => ({
          ...item,
          funcao: item.idFuncao != null ? roleById.get(item.idFuncao) : undefined,
          supervisor: item.idSupervisor != null ? supervisorById.get(item.idSupervisor) : undefined,
          posto: item.idPosto != null ? stationById.get(item.idPosto) : undefined,
        }));
      })
    );
  }

  getById(id: number): Observable<DiariaDisponivel> {
    return this.http.get<DiariaDisponivel>(`${this.apiUrl}/${id}`);
  }

  create(item: DiariaDisponivel): Observable<DiariaDisponivel> {
    const user = this.authService.getUserData();
    const payload = {
      ...item,
      usuarioCadAlt: user?.user || 'sistema'
    };
    return this.http.post<DiariaDisponivel>(this.apiUrl, payload);
  }

  update(id: number, item: DiariaDisponivel): Observable<void> {
    const user = this.authService.getUserData();
    const payload = {
      ...item,
      usuarioCadAlt: user?.user || 'sistema'
    };
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
