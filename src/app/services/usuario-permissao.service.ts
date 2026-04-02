import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface UsuarioPermissao {
  id?: number;
  idUsuario: number;
  controller: string;
  apenasLeitura: boolean;
  ativo: boolean;
  dataCadastro?: string;
  nomeAmigavelArea?: string;
}

export interface ControllerItem {
  valor: number;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioPermissaoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/UsuarioPermissao`;
  private readonly http = inject(HttpClient);

  getAll(): Observable<UsuarioPermissao[]> {
    return this.http.get<UsuarioPermissao[]>(this.apiUrl);
  }

  getById(id: number): Observable<UsuarioPermissao> {
    return this.http.get<UsuarioPermissao>(`${this.apiUrl}/${id}`);
  }

  getByUserId(idUsuario: number): Observable<UsuarioPermissao[]> {
    return this.http.get<UsuarioPermissao[]>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  getControllers(): Observable<ControllerItem[]> {
    return this.http.get<ControllerItem[]>(`${this.apiUrl}/controllers`);
  }

  create(permissao: UsuarioPermissao): Observable<number> {
    return this.http.post<number>(this.apiUrl, permissao);
  }

  update(id: number, permissao: UsuarioPermissao): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, permissao);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteByUserId(idUsuario: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuario/${idUsuario}`);
  }
}